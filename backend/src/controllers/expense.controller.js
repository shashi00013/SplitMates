import { prisma } from '../utils/prisma.js';
import { expenseSchema, baseExpenseSchema } from '../utils/validators.js';
import { serializeExpense } from '../utils/serializers.js';

/**
 * Calculate per-participant share amounts using integer cent precision.
 * Guarantees SUM(shares) === totalAmount down to exact cents.
 */
function computeExactShares(amount, participants, customShares) {
  const totalCents = Math.round(amount * 100);
  const count = participants.length;
  const sharesMap = {};

  if (customShares && Object.keys(customShares).length > 0) {
    let sumCents = 0;
    for (const p of participants) {
      const shareVal = Number(customShares[p] || 0);
      if (shareVal < 0) {
        throw new Error('Share amounts cannot be negative');
      }
      const shareCents = Math.round(shareVal * 100);
      sharesMap[p] = shareCents / 100;
      sumCents += shareCents;
    }
    if (sumCents !== totalCents) {
      throw new Error('Sum of participant shares must equal total expense amount exactly');
    }
  } else {
    // Equal split with integer cent remainder distribution
    const baseCents = Math.floor(totalCents / count);
    const remainderCents = totalCents - baseCents * count;

    participants.forEach((pId, idx) => {
      const cents = baseCents + (idx < remainderCents ? 1 : 0);
      sharesMap[pId] = cents / 100;
    });
  }

  return sharesMap;
}

export async function getExpenses(req, res, next) {
  try {
    const userId = req.user.id;
    const groupId = req.query.groupId || req.params.groupId;

    const userMemberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const allowedGroupIds = userMemberships.map((m) => m.groupId);

    if (groupId && !allowedGroupIds.includes(groupId)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied to group expenses' });
    }

    const targetGroupIds = groupId ? [groupId] : allowedGroupIds;

    const expenses = await prisma.expense.findMany({
      where: {
        groupId: { in: targetGroupIds },
      },
      include: {
        shares: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const serialized = expenses.map(serializeExpense);
    return res.json({ expenses: serialized });
  } catch (err) {
    next(err);
  }
}

export async function createExpense(req, res, next) {
  try {
    const validated = expenseSchema.parse(req.body);
    const userId = req.user.id;
    const { groupId, title, emoji, amount, paidBy, splitType, shares, date } = validated;

    const rawParticipants = validated.participants || validated.splitAmong || [];
    const participants = Array.from(new Set(rawParticipants));

    if (participants.length === 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'At least one participant is required' });
    }

    // Consolidated Authorization & Membership check in 1 single DB query
    const allRequiredUserIds = Array.from(new Set([userId, paidBy, ...participants]));
    const memberRecords = await prisma.groupMember.findMany({
      where: { groupId, userId: { in: allRequiredUserIds } },
    });
    const memberUserIds = new Set(memberRecords.map((m) => m.userId));

    if (!memberUserIds.has(userId)) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this group' });
    }
    if (!memberUserIds.has(paidBy)) {
      return res.status(400).json({ error: 'Validation Error', message: 'Payer must be a member of the group' });
    }
    if (participants.some((pId) => !memberUserIds.has(pId))) {
      return res.status(400).json({ error: 'Validation Error', message: 'All participants must be current members of the group' });
    }

    // Settlement Lock Check: Reject new expenses if settlement is in progress
    const pendingSettlement = await prisma.settlement.findFirst({
      where: { groupId, status: 'pending' },
    });
    if (pendingSettlement) {
      return res.status(400).json({
        error: 'Conflict',
        message: 'Settlement is currently in progress. New expenses cannot be added until settlement is completed or cancelled.',
      });
    }

    // Get active cycle for group
    let activeCycle = await prisma.expenseCycle.findFirst({
      where: { groupId, status: 'active' },
    });
    if (!activeCycle) {
      activeCycle = await prisma.expenseCycle.create({
        data: { groupId, status: 'active', startDate: new Date() },
      });
    }

    // Calculate exact shares
    let sharesMap;
    try {
      sharesMap = computeExactShares(amount, participants, shares);
    } catch (shareErr) {
      return res.status(400).json({ error: 'Validation Error', message: shareErr.message });
    }

    // Transactional write
    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          groupId,
          cycleId: activeCycle.id,
          title,
          emoji: emoji || '💰',
          amount,
          paidBy,
          splitType: splitType || 'equal',
          date: date ? new Date(date) : new Date(),
          settled: false,
          shares: {
            create: participants.map((pId) => ({
              userId: pId,
              amount: sharesMap[pId] || 0,
            })),
          },
        },
        include: {
          shares: true,
        },
      });
      return created;
    });

    const serialized = serializeExpense(expense);
    return res.status(201).json({ expense: serialized });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', message: err.errors[0]?.message || 'Invalid input data' });
    }
    next(err);
  }
}

export async function updateExpense(req, res, next) {
  try {
    const { id: expenseId } = req.params;
    const userId = req.user.id;

    const existing = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { shares: true, cycle: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Expense not found' });
    }

    if (existing.settled || existing.cycle?.status === 'closed') {
      return res.status(400).json({ error: 'Conflict', message: 'Cannot edit an expense from a closed or settled cycle' });
    }

    // Settlement Lock Check
    const pendingSettlement = await prisma.settlement.findFirst({
      where: { groupId: existing.groupId, status: 'pending' },
    });
    if (pendingSettlement) {
      return res.status(400).json({
        error: 'Conflict',
        message: 'Settlement is currently in progress. Expenses cannot be updated until settlement is completed or cancelled.',
      });
    }

    const validated = baseExpenseSchema.partial().parse(req.body);
    const title = validated.title || existing.title;
    const emoji = validated.emoji || existing.emoji;
    const amount = validated.amount !== undefined ? validated.amount : Number(existing.amount);
    const paidBy = validated.paidBy || existing.paidBy;
    const splitType = validated.splitType || existing.splitType;
    const rawParticipants = validated.participants || validated.splitAmong || existing.shares.map((s) => s.userId);
    const participants = Array.from(new Set(rawParticipants));

    if (participants.length === 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'At least one participant is required' });
    }

    // Consolidated Authorization & Membership check in 1 single DB query
    const allRequiredUserIds = Array.from(new Set([userId, paidBy, ...participants]));
    const memberRecords = await prisma.groupMember.findMany({
      where: { groupId: existing.groupId, userId: { in: allRequiredUserIds } },
    });
    const memberUserIds = new Set(memberRecords.map((m) => m.userId));

    if (!memberUserIds.has(userId)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }
    if (!memberUserIds.has(paidBy)) {
      return res.status(400).json({ error: 'Validation Error', message: 'Payer must be a member of the group' });
    }
    if (participants.some((pId) => !memberUserIds.has(pId))) {
      return res.status(400).json({ error: 'Validation Error', message: 'All participants must be current members of the group' });
    }

    let sharesMap;
    try {
      sharesMap = computeExactShares(amount, participants, validated.shares);
    } catch (shareErr) {
      return res.status(400).json({ error: 'Validation Error', message: shareErr.message });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.expenseShare.deleteMany({
        where: { expenseId },
      });

      const result = await tx.expense.update({
        where: { id: expenseId },
        data: {
          title,
          emoji,
          amount,
          paidBy,
          splitType,
          date: validated.date ? new Date(validated.date) : existing.date,
          shares: {
            create: participants.map((pId) => ({
              userId: pId,
              amount: sharesMap[pId] || 0,
            })),
          },
        },
        include: {
          shares: true,
        },
      });
      return result;
    });

    const serialized = serializeExpense(updated);
    return res.json({ expense: serialized });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', message: err.errors[0]?.message || 'Invalid input data' });
    }
    next(err);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    const { id: expenseId } = req.params;
    const userId = req.user.id;

    const existing = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { cycle: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Expense not found' });
    }

    const callerMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: existing.groupId, userId } },
    });
    if (!callerMembership) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }

    if (existing.settled || existing.cycle?.status === 'closed') {
      return res.status(400).json({ error: 'Conflict', message: 'Cannot delete an expense from a closed or settled cycle' });
    }

    // Settlement Lock Check
    const pendingSettlement = await prisma.settlement.findFirst({
      where: { groupId: existing.groupId, status: 'pending' },
    });
    if (pendingSettlement) {
      return res.status(400).json({
        error: 'Conflict',
        message: 'Settlement is currently in progress. Expenses cannot be deleted until settlement is completed or cancelled.',
      });
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    next(err);
  }
}

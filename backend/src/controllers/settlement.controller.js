import { prisma } from '../utils/prisma.js';
import { serializeSettlement } from '../utils/serializers.js';

export async function getSettlementHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const groupId = req.query.groupId || req.params.groupId;

    const userMemberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const allowedGroupIds = userMemberships.map((m) => m.groupId);

    if (groupId && !allowedGroupIds.includes(groupId)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }

    const targetGroupIds = groupId ? [groupId] : allowedGroupIds;

    const settlements = await prisma.settlement.findMany({
      where: {
        groupId: { in: targetGroupIds },
        status: 'completed',
      },
      include: {
        confirmations: true,
        transactions: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    const serialized = settlements.map(serializeSettlement);
    return res.json({ settlements: serialized, history: serialized });
  } catch (err) {
    next(err);
  }
}

export async function initiateSettlement(req, res, next) {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied to group' });
    }

    let activeCycle = await prisma.expenseCycle.findFirst({
      where: { groupId, status: 'active' },
    });
    if (!activeCycle) {
      activeCycle = await prisma.expenseCycle.create({
        data: { groupId, status: 'active', startDate: new Date() },
      });
    }

    let settlement = await prisma.settlement.findFirst({
      where: { groupId, status: 'pending' },
      include: { confirmations: true, transactions: true },
    });

    if (!settlement) {
      settlement = await prisma.settlement.create({
        data: {
          groupId,
          cycleId: activeCycle.id,
          status: 'pending',
          confirmations: {
            create: {
              userId,
            },
          },
        },
        include: { confirmations: true, transactions: true },
      });
    } else {
      // Add initiator confirmation if not already confirmed
      const hasConfirmed = settlement.confirmations.some((c) => c.userId === userId);
      if (!hasConfirmed) {
        await prisma.settlementConfirmation.create({
          data: {
            settlementId: settlement.id,
            userId,
          },
        });
        settlement = await prisma.settlement.findUnique({
          where: { id: settlement.id },
          include: { confirmations: true, transactions: true },
        });
      }
    }

    const serialized = serializeSettlement(settlement);
    return res.json({ success: true, groupId, settlement: serialized });
  } catch (err) {
    next(err);
  }
}

export async function cancelSettlement(req, res, next) {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied to group' });
    }

    const pendingSettlement = await prisma.settlement.findFirst({
      where: { groupId, status: 'pending' },
    });

    if (!pendingSettlement) {
      return res.status(404).json({ error: 'Not Found', message: 'No pending settlement found to cancel' });
    }

    await prisma.settlement.delete({
      where: { id: pendingSettlement.id },
    });

    return res.json({ success: true, message: 'Settlement cancelled successfully' });
  } catch (err) {
    next(err);
  }
}

export async function confirmSettlement(req, res, next) {
  try {
    const { groupId } = req.params;
    const targetUserId = req.body.memberId || req.user.id;
    const authUserId = req.user.id;

    // Caller authorization check
    const callerMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: authUserId } },
    });
    if (!callerMembership) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied to group' });
    }

    // Target user membership check
    const targetMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (!targetMembership) {
      return res.status(400).json({ error: 'Validation Error', message: 'Target user is not a member of this group' });
    }

    const settlement = await prisma.settlement.findFirst({
      where: { groupId, status: 'pending' },
      include: { confirmations: true },
    });

    if (!settlement) {
      return res.status(404).json({ error: 'Not Found', message: 'No active settlement in progress to confirm' });
    }

    const hasConfirmed = settlement.confirmations.some((c) => c.userId === targetUserId);
    if (!hasConfirmed) {
      await prisma.settlementConfirmation.create({
        data: {
          settlementId: settlement.id,
          userId: targetUserId,
        },
      });
    }

    const updated = await prisma.settlement.findUnique({
      where: { id: settlement.id },
      include: { confirmations: true, transactions: true },
    });

    const confirmations = updated.confirmations.map((c) => String(c.userId));
    return res.json({ success: true, memberId: targetUserId, confirmations, settlement: serializeSettlement(updated) });
  } catch (err) {
    next(err);
  }
}

export async function completeSettlement(req, res, next) {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const callerMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!callerMembership) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied to group' });
    }

    const pendingSettlement = await prisma.settlement.findFirst({
      where: { groupId, status: 'pending' },
      include: { confirmations: true },
    });

    if (!pendingSettlement) {
      return res.status(404).json({ error: 'Not Found', message: 'No pending settlement found to complete' });
    }

    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const groupMemberIds = groupMembers.map((m) => m.userId);

    // Verify all active group members have confirmed
    const confirmedUserIds = new Set(pendingSettlement.confirmations.map((c) => c.userId));
    const unconfirmedMembers = groupMemberIds.filter((mId) => !confirmedUserIds.has(mId));

    if (unconfirmedMembers.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Settlement cannot be completed until all members confirm. Pending confirmations: ${unconfirmedMembers.length}`,
      });
    }

    // Get active cycle and unsettled expenses
    const activeCycle = await prisma.expenseCycle.findFirst({
      where: { groupId, status: 'active' },
    });

    const unsettledExpenses = await prisma.expense.findMany({
      where: {
        groupId,
        settled: false,
      },
      include: {
        shares: true,
      },
    });

    // Calculate balances using integer cents
    const balancesInCents = {};
    groupMemberIds.forEach((mId) => {
      balancesInCents[mId] = 0;
    });

    unsettledExpenses.forEach((exp) => {
      const payerId = exp.paidBy;
      const amountCents = Math.round(Number(exp.amount) * 100);

      if (balancesInCents[payerId] !== undefined) {
        balancesInCents[payerId] += amountCents;
      }

      exp.shares.forEach((share) => {
        const participantId = share.userId;
        const shareCents = Math.round(Number(share.amount) * 100);
        if (balancesInCents[participantId] !== undefined) {
          balancesInCents[participantId] -= shareCents;
        }
      });
    });

    // Invariant Check: Sum of net balances must equal 0 exactly
    const sumCents = Object.values(balancesInCents).reduce((s, val) => s + val, 0);
    if (sumCents !== 0) {
      return res.status(500).json({
        error: 'Calculation Error',
        message: 'Group balance invariant violation: Net balance sum is non-zero.',
      });
    }

    // Separate debtors and creditors in integer cents
    const debtors = [];
    const creditors = [];

    Object.entries(balancesInCents).forEach(([mId, netCents]) => {
      if (netCents < 0) {
        debtors.push({ userId: mId, amountCents: Math.abs(netCents) });
      } else if (netCents > 0) {
        creditors.push({ userId: mId, amountCents: netCents });
      }
    });

    // Sort descending for deterministic greedy matching
    debtors.sort((a, b) => b.amountCents - a.amountCents);
    creditors.sort((a, b) => b.amountCents - a.amountCents);

    const transactions = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debt = debtors[i];
      const cred = creditors[j];
      const paymentCents = Math.min(debt.amountCents, cred.amountCents);

      if (paymentCents > 0) {
        transactions.push({
          fromUser: debt.userId,
          toUser: cred.userId,
          amount: paymentCents / 100,
        });
      }

      debt.amountCents -= paymentCents;
      cred.amountCents -= paymentCents;

      if (debt.amountCents === 0) i++;
      if (cred.amountCents === 0) j++;
    }

    const totalSettledCents = transactions.reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0);
    const totalSettled = totalSettledCents / 100;

    // Transactional DB completion
    const completedSettlement = await prisma.$transaction(async (tx) => {
      const settlement = await tx.settlement.update({
        where: { id: pendingSettlement.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          completedBy: userId,
          totalSettled,
        },
      });

      // Clear existing temporary transactions and add final calculated transactions
      await tx.settlementTransaction.deleteMany({
        where: { settlementId: settlement.id },
      });

      if (transactions.length > 0) {
        await tx.settlementTransaction.createMany({
          data: transactions.map((t) => ({
            settlementId: settlement.id,
            fromUser: t.fromUser,
            toUser: t.toUser,
            amount: t.amount,
          })),
        });
      }

      // Mark expenses as settled
      await tx.expense.updateMany({
        where: { groupId, settled: false },
        data: { settled: true, settlementId: settlement.id },
      });

      // Close active cycle & open new active cycle
      if (activeCycle) {
        await tx.expenseCycle.update({
          where: { id: activeCycle.id },
          data: { status: 'closed', endDate: new Date(), settlementId: settlement.id },
        });
      }

      await tx.expenseCycle.create({
        data: {
          groupId,
          status: 'active',
          startDate: new Date(),
        },
      });

      const result = await tx.settlement.findUnique({
        where: { id: settlement.id },
        include: { confirmations: true, transactions: true },
      });

      return result;
    });

    const serialized = serializeSettlement(completedSettlement);
    return res.json({ settlement: serialized, historyEntry: serialized });
  } catch (err) {
    next(err);
  }
}

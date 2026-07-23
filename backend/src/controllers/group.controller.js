import { prisma } from '../utils/prisma.js';
import { createGroupSchema, joinGroupSchema } from '../utils/validators.js';
import { serializeGroup, serializeUser } from '../utils/serializers.js';

export async function getGroups(req, res, next) {
  try {
    const userId = req.user.id;

    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    const groups = groupMemberships.map((gm) => serializeGroup(gm.group));
    return res.json({ groups });
  } catch (err) {
    next(err);
  }
}

export async function getGroupMembers(req, res, next) {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    // Authorization check
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this group' });
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });

    const serializedMembers = members.map((m) => serializeUser(m.user));
    return res.json({ members: serializedMembers });
  } catch (err) {
    next(err);
  }
}

function generateFastInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createGroup(req, res, next) {
  try {
    const validated = createGroupSchema.parse(req.body);
    const userId = req.user.id;
    const shortCode = generateFastInviteCode();

    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          name: validated.name,
          description: validated.description || '',
          icon: validated.icon || '🏠',
          inviteCode: shortCode,
          createdBy: userId,
          members: {
            create: {
              userId,
            },
          },
          cycles: {
            create: {
              status: 'active',
              startDate: new Date(),
            },
          },
        },
        include: {
          members: {
            include: { user: true },
          },
        },
      });
      return newGroup;
    });

    const serialized = serializeGroup(group);
    return res.status(201).json({ group: serialized });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', message: err.errors[0]?.message || 'Invalid input data' });
    }
    next(err);
  }
}

export async function joinGroup(req, res, next) {
  try {
    const validated = joinGroupSchema.parse(req.body);
    const userId = req.user.id;
    const codeToSearch = validated.inviteCode.trim();

    const group = await prisma.group.findFirst({
      where: {
        OR: [
          { inviteCode: codeToSearch },
          { inviteCode: codeToSearch.toUpperCase() },
          { inviteCode: codeToSearch.toLowerCase() },
        ],
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Not Found', message: 'Invalid invite code or group not found' });
    }

    const existingMember = group.members.find((m) => m.userId === userId);
    if (existingMember) {
      const serialized = serializeGroup(group);
      return res.json({ group: serialized });
    }

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: userId,
      },
    });

    const updatedGroup = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    const serialized = serializeGroup(updatedGroup);
    return res.json({ group: serialized });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', message: err.errors[0]?.message || 'Invalid input data' });
    }
    next(err);
  }
}

export async function leaveGroup(req, res, next) {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      return res.status(404).json({ error: 'Not Found', message: 'You are not a member of this group' });
    }

    // Compute user's net balance in unsettled expenses
    const unsettledExpenses = await prisma.expense.findMany({
      where: { groupId, settled: false },
      include: { shares: true },
    });

    let netCents = 0;
    unsettledExpenses.forEach((exp) => {
      if (exp.paidBy === userId) {
        netCents += Math.round(Number(exp.amount) * 100);
      }
      exp.shares.forEach((share) => {
        if (share.userId === userId) {
          netCents -= Math.round(Number(share.amount) * 100);
        }
      });
    });

    if (netCents !== 0) {
      const netVal = (netCents / 100).toFixed(2);
      return res.status(400).json({
        error: 'Validation Error',
        message: `Cannot leave group with an outstanding balance of ₹${netVal}. Please settle up before leaving.`,
      });
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    return res.json({ success: true, message: 'Successfully left group' });
  } catch (err) {
    next(err);
  }
}

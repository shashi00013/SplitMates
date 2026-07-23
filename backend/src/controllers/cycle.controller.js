import { prisma } from '../utils/prisma.js';
import { serializeCycle } from '../utils/serializers.js';

export async function getCycles(req, res, next) {
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

    const cycles = await prisma.expenseCycle.findMany({
      where: {
        groupId: { in: targetGroupIds },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    const serialized = cycles.map(serializeCycle);
    return res.json({ cycles: serialized });
  } catch (err) {
    next(err);
  }
}

export async function startNewCycle(req, res, next) {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }

    const newCycle = await prisma.$transaction(async (tx) => {
      // Close active cycle
      await tx.expenseCycle.updateMany({
        where: { groupId, status: 'active' },
        data: { status: 'closed', endDate: new Date() },
      });

      // Create new active cycle
      const created = await tx.expenseCycle.create({
        data: {
          groupId,
          status: 'active',
          startDate: new Date(),
        },
      });
      return created;
    });

    const serialized = serializeCycle(newCycle);
    return res.status(201).json({ cycle: serialized });
  } catch (err) {
    next(err);
  }
}

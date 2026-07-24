import { prisma } from '../utils/prisma.js';

export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    if (notificationId === 'all') {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Not Found', message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return res.json({ success: true, notification: updated });
  } catch (err) {
    next(err);
  }
}

export async function sendSettlementReminder(req, res, next) {
  try {
    const { groupId } = req.body;
    const senderId = req.user.id;

    if (!groupId) {
      return res.status(400).json({ error: 'Validation Error', message: 'groupId is required' });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: true } } },
    });

    if (!group) {
      return res.status(404).json({ error: 'Not Found', message: 'Group not found' });
    }

    const pendingSettlement = await prisma.settlement.findFirst({
      where: { groupId, status: 'pending' },
      include: { confirmations: true },
    });

    if (!pendingSettlement) {
      return res.status(400).json({ error: 'Validation Error', message: 'No active settlement pending to remind members about' });
    }

    const senderUser = await prisma.user.findUnique({ where: { id: senderId } });
    const confirmedUserIds = new Set(pendingSettlement.confirmations.map((c) => c.userId));

    const pendingMembers = group.members.filter((m) => m.userId !== senderId && !confirmedUserIds.has(m.userId));

    console.log(`[NOTIFICATION EVENT] Settlement reminder triggered for group ${groupId} by user ${senderId}`);

    const notificationsData = pendingMembers.map((m) => {
      console.log(`[NOTIFICATION RECIPIENT] User ${m.userId} (${m.user.name}) target for settlement reminder`);
      return {
        userId: m.userId,
        senderId,
        groupId,
        title: 'Settlement Reminder ⏳',
        message: `${senderUser?.name || 'A group member'} is waiting for your settlement confirmation in "${group.name}".`,
        type: 'settlement_reminder',
      };
    });

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({
        data: notificationsData,
      });
    }

    return res.json({
      success: true,
      message: `Sent reminders to ${notificationsData.length} pending member(s)`,
      count: notificationsData.length,
    });
  } catch (err) {
    next(err);
  }
}

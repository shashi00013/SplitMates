import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotifications,
  markAsRead,
  sendSettlementReminder,
} from '../controllers/notification.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.patch('/:notificationId/read', markAsRead);
router.post('/mark-all-read', (req, res, next) => {
  req.params.notificationId = 'all';
  return markAsRead(req, res, next);
});
router.post('/remind', sendSettlementReminder);

export default router;

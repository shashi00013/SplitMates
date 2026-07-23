import { Router } from 'express';
import { getSettlementHistory } from '../controllers/settlement.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/history', getSettlementHistory);

export default router;

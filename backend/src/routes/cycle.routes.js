import { Router } from 'express';
import { getCycles } from '../controllers/cycle.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getCycles);

export default router;

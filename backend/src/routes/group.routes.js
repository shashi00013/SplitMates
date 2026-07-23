import { Router } from 'express';
import { getGroups, getGroupMembers, createGroup, joinGroup, leaveGroup } from '../controllers/group.controller.js';
import { getExpenses } from '../controllers/expense.controller.js';
import { getCycles, startNewCycle } from '../controllers/cycle.controller.js';
import { getSettlementHistory, initiateSettlement, confirmSettlement, cancelSettlement, completeSettlement } from '../controllers/settlement.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getGroups);
router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/:id/members', getGroupMembers);
router.post('/:id/leave', leaveGroup);

// Group-nested expense, cycle, and settlement endpoints matching frontend API contract
router.get('/:groupId/expenses', getExpenses);
router.get('/:groupId/cycles', getCycles);
router.post('/:groupId/cycles', startNewCycle);
router.get('/:groupId/settlements/history', getSettlementHistory);
router.post('/:groupId/settlements/initiate', initiateSettlement);
router.post('/:groupId/settlements/cancel', cancelSettlement);
router.post('/:groupId/settlements/confirm', confirmSettlement);
router.post('/:groupId/settlements/complete', completeSettlement);

export default router;

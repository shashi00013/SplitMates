import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimiter, forgotPasswordRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

router.put('/change-password', authenticateToken, changePassword);
router.post('/forgot-password', forgotPasswordRateLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

export default router;

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/env.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validators.js';
import { serializeUser } from '../utils/serializers.js';

export async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existing) {
      return res.status(400).json({ error: 'Validation Error', message: 'Email address already registered' });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        password: hashedPassword,
        color: '#CCFF00',
      },
    });

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    const serialized = serializeUser(user);
    return res.status(201).json({ token, user: serialized });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', message: err.errors[0]?.message || 'Invalid input data' });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(validated.password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    const serialized = serializeUser(user);
    return res.json({ token, user: serialized });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', message: err.errors[0]?.message || 'Invalid input data' });
    }
    next(err);
  }
}

export async function getMe(req, res) {
  return res.json({ user: req.user });
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const { name, avatar, avatarId } = req.body;
    const selectedAvatar = avatarId || avatar || 'avatar_01';

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        avatar: selectedAvatar,
      },
    });

    const serialized = serializeUser(updatedUser);
    return res.json({ user: serialized });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const validated = changePasswordSchema.parse(req.body);
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    if (validated.currentPassword === validated.newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'New password must not equal current password',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    const isCurrentValid = await bcrypt.compare(validated.currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(400).json({ error: 'Unauthorized', message: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(validated.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return res.json({ message: 'Password updated successfully ✅' });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', message: err.errors[0]?.message || 'Invalid input data' });
    }
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const validated = forgotPasswordSchema.parse(req.body);
    const GENERIC_RESPONSE = {
      message: 'If an account exists for this email, a reset link has been sent.',
    };

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!user) {
      // Prevent email enumeration
      return res.json(GENERIC_RESPONSE);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Generate reset URL for notification/logs
    const clientBase = req.headers.origin || 'http://localhost:3000';
    const resetUrl = `${clientBase}/reset-password/${resetToken}`;
    console.log(`[PASSWORD RESET] Email: ${user.email} | Reset Link: ${resetUrl}`);

    return res.json(GENERIC_RESPONSE);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', message: err.errors[0]?.message || 'Invalid email address' });
    }
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const token = req.params.token || req.body.token;
    if (!token) {
      return res.status(400).json({ error: 'Validation Error', message: 'Reset token is required' });
    }

    const validated = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Reset token is invalid or has expired',
      });
    }

    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return res.json({ message: 'Password reset successfully ✅' });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', message: err.errors[0]?.message || 'Invalid input data' });
    }
    next(err);
  }
}

export async function verifyResetToken(req, res) {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ valid: false, message: 'Reset token is required' });
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return res.status(400).json({ valid: false, message: 'Reset token is invalid or has expired' });
  }

  return res.json({ valid: true, message: 'Reset token is valid' });
}


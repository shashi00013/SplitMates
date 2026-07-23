import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/env.js';
import { registerSchema, loginSchema } from '../utils/validators.js';
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

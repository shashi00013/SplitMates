import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../utils/prisma.js';
import { serializeUser } from '../utils/serializers.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User no longer exists' });
    }

    req.user = serializeUser(user);
    req.rawUser = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

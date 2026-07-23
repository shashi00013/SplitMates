import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import groupRoutes from './routes/group.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import cycleRoutes from './routes/cycle.routes.js';
import settlementRoutes from './routes/settlement.routes.js';

const app = express();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.nodeEnv === 'development') {
        return callback(null, true);
      }
      if (config.clientOrigin === '*' || origin === config.clientOrigin) {
        return callback(null, true);
      }
      const allowedOrigins = config.clientOrigin.split(',').map((o) => o.trim());
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parser Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/settlements', settlementRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;

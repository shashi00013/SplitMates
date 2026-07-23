import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  console.error('[API Error]:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Server Error' : 'Client Error',
    message: statusCode >= 500 && config.nodeEnv === 'production' ? 'An unexpected server error occurred' : message,
    ...(config.nodeEnv === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

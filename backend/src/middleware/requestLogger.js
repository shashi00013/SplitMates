import { randomUUID } from 'crypto';

/**
 * Request Tracing & Structured Logging Middleware for SplitMates
 * Attaches a unique request ID to every incoming request and logs timing & status safely.
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const logData = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      route: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
    };

    if (durationMs > 1000) {
      console.warn(`[WARN: SLOW REQUEST] ${req.method} ${req.originalUrl} took ${durationMs}ms`, logData);
    } else if (res.statusCode >= 400) {
      console.warn(`[API ${res.statusCode}] ${req.method} ${req.originalUrl}`, logData);
    } else {
      console.log(`[API 200] ${req.method} ${req.originalUrl} (${durationMs}ms)`, logData);
    }
  });

  next();
}

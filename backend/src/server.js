import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SplitMates Backend Server running on port ${PORT} (0.0.0.0)`);
  console.log(`📡 Local Network Access: http://10.36.114.117:${PORT}/api`);
});

// ── Graceful Shutdown Handler ──────────────────────────────────────────────
function handleShutdown(signal) {
  console.log(`\n🛑 ${signal} received. Initiating graceful shutdown...`);
  server.close(() => {
    console.log('✅ SplitMates HTTP server closed cleanly. Exiting process.');
    process.exit(0);
  });

  // Force close after 10s timeout if connections persist
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time. Forcing process exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

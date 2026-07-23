import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SplitMates Backend Server running on port ${PORT} (0.0.0.0)`);
  console.log(`📡 Local Network Access: http://10.36.114.117:${PORT}/api`);
});

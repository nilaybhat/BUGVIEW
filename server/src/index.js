import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { ensureUploadDir } from './services/screenshot.service.js';
import env from './config/env.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDatabase();
  await ensureUploadDir();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`BUGTRACK API listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

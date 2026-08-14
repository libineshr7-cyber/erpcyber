import app from './app';
import { config } from './config/env';
import pool from './config/database';
import logger from './utils/logger';
import fs from 'fs';

// Ensure storage directories exist
['./storage/reports', './uploads', './logs'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function startServer(): Promise<void> {
  // Verify database connection
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('✅ PostgreSQL connection verified');
  } catch (err) {
    logger.error('❌ Could not connect to PostgreSQL. Is Docker running?', { error: err });
    logger.info('Run: docker compose up -d (from d:/ERP/)');
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info(`🚀 ERP Backend running on http://localhost:${config.port}`);
    logger.info(`📦 Environment: ${config.nodeEnv}`);
    logger.info(`🔒 Session: HttpOnly + SameSite=Strict cookies`);
    logger.info(`🛡️  Security: Helmet + Rate Limiting + RBAC active`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await pool.end();
      logger.info('PostgreSQL pool closed');
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', { reason });
  });
}

startServer();

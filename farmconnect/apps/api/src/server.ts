import { createServer } from 'http';

import { app } from './app';
import { config } from './config';
import { logger } from './core/logger';

const server = createServer(app);

export function startServer(): void {
  server.listen(config.PORT, () => {
    logger.info(`[api] Server running on http://localhost:${config.PORT} — env: ${config.NODE_ENV}`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    logger.info(`[api] ${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('[api] HTTP server closed');
      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      logger.error('[api] Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, '[api] Unhandled promise rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, '[api] Uncaught exception — shutting down');
    process.exit(1);
  });
}

export { server };

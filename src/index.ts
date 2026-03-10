import { app } from './app';
import { env } from './config/env.config';
import { createLogger } from './utils/logger.util';
import { APP_NAME, APP_VERSION } from './config/app.constants';

const logger = createLogger('server');

const server = app.listen(env.PORT, () => {
  logger.info(`${APP_NAME} started`, {
    version: APP_VERSION,
    port: env.PORT,
    environment: env.NODE_ENV,
    operation: 'server.start',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully', { operation: 'server.shutdown' });
  server.close(() => {
    logger.info('HTTP server closed', { operation: 'server.shutdown' });
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down gracefully', { operation: 'server.shutdown' });
  server.close(() => {
    process.exit(0);
  });
});

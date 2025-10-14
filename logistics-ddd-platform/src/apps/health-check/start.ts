import 'reflect-metadata';
import { HealthCheckApp } from './HealthCheckApp';
import { AppDataSource } from '../../Shared/infrastructure/persistence/TypeOrmConfig';
import { log } from '@/utils/log';

async function start() {
  log.load('Starting Health Check Service...');

  try {
    // Initialize database connection
    log.load('Connecting to database...');
    await AppDataSource.initialize();
    log.ok('Database connected');

    // Start the health check service
    const app = new HealthCheckApp();
    await app.start();

    log.ok('Health Check service started successfully');

    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      log.info('SIGTERM received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      log.info('SIGINT received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

  } catch (error) {
    log.err(`Failed to start health check: ${error}`);
    process.exit(1);
  }
}

// Start the application
start();
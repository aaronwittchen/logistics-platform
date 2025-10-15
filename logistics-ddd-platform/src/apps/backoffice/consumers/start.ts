import 'reflect-metadata';
import { log } from '@/utils/log';
import { RabbitMQConnection } from '@/Shared/infrastructure/event-bus/RabbitMQConnection';
import { RabbitMQConsumer } from '@/Shared/infrastructure/event-bus/RabbitMQConsumer';
import { ElasticSearchClient } from '@/Shared/infrastructure/persistence/ElasticSearchClient';
import { ElasticSearchTrackingProjectionRepository } from '@/Contexts/Backoffice/TrackingProjection/infrastructure/ElasticSearchTrackingProjectionRepository';
import { StockItemReservedProjector } from '@/Contexts/Backoffice/TrackingProjection/application/StockItemReservedProjector';
import { PackageRegisteredProjector } from '@/Contexts/Backoffice/TrackingProjection/application/PackageRegisteredProjector';
import { TrackingProjectionRepository } from '@/Contexts/Backoffice/TrackingProjection/domain/TrackingProjectionRepository';

async function startBackofficeConsumer() {
  log.info('Starting Backoffice Consumer...');

  // Initialize RabbitMQ connection
  const connection = new RabbitMQConnection({
    hostname: process.env.RABBITMQ_HOST || 'localhost',
    port: Number(process.env.RABBITMQ_PORT) || 5672,
    username: process.env.RABBITMQ_USER || 'logistics_user',
    password: process.env.RABBITMQ_PASS || 'logistics_pass',
  });

  await connection.connect();
  log.ok('RabbitMQ connected');

  // Initialize ElasticSearch client and repository
  const esClient = new ElasticSearchClient();
  let repository: TrackingProjectionRepository | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let subscribers: any[] = [];

  try {
    const isHealthy = await esClient.healthCheck();
    if (isHealthy) {
      log.ok('ElasticSearch connected and healthy');
      repository = new ElasticSearchTrackingProjectionRepository(esClient);
      subscribers = [new StockItemReservedProjector(repository), new PackageRegisteredProjector(repository)];
    } else {
      log.warn('ElasticSearch health check returned false - projections disabled');
      log.info('Start ElasticSearch to enable projection updates');
    }
  } catch (error) {
    log.warn(`ElasticSearch connection failed: ${error instanceof Error ? error.message : String(error)}`);
    log.info('Projections will not be available until ElasticSearch is running');
  }

  // Initialize event consumer
  const consumer = new RabbitMQConsumer(connection);

  if (subscribers.length > 0) {
    await consumer.start(subscribers);
    log.ok('Backoffice consumer started - listening for events');
  } else {
    log.ok('Backoffice consumer started - no projectors available');
  }

  // Graceful shutdown handling
  process.on('SIGTERM', async () => {
    log.info('SIGTERM received, shutting down gracefully...');
    await connection.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    log.info('SIGINT received, shutting down gracefully...');
    await connection.close();
    process.exit(0);
  });
}

startBackofficeConsumer().catch(error => {
  log.err(`Failed to start backoffice consumer: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

import 'reflect-metadata';
import { RabbitMQConnection } from '../../../Shared/infrastructure/event-bus/RabbitMQConnection';
import { RabbitMQConsumer } from '../../../Shared/infrastructure/event-bus/RabbitMQConsumer';
import { StockItemAddedLogger } from '../../../Contexts/Inventory/StockItem/application/subscribers/StockItemAddedLogger';
import { log } from '../../../utils/log';

async function startConsumer() {
  const connection = new RabbitMQConnection({
    hostname: 'localhost',
    port: 5672,
    username: 'logistics_user',
    password: 'logistics_pass',
  });

  await connection.connect();

  const consumer = new RabbitMQConsumer(connection);
  const subscribers = [new StockItemAddedLogger()];

  await consumer.start(subscribers);

  log.ok('Consumer started');
}

startConsumer().catch((error) => {
  log.err(`Failed to start consumer: ${error}`);
  process.exit(1);
});
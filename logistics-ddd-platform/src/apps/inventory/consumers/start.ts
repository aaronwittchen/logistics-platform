import 'reflect-metadata';
import { RabbitMQConnection } from '@/Shared/infrastructure/event-bus/RabbitMQConnection';
import { RabbitMQConsumer } from '@/Shared/infrastructure/event-bus/RabbitMQConsumer';
import { StockItemAddedLogger } from '@/Contexts/Inventory/StockItem/application/subscribers/StockItemAddedLogger';
import { log } from '@/utils/log';

async function startConsumer() {
  const connection = new RabbitMQConnection({
    hostname: process.env.RABBITMQ_HOST || 'localhost',
    port: Number(process.env.RABBITMQ_PORT) || 5672,
    username: process.env.RABBITMQ_USER || 'logistics_user',
    password: process.env.RABBITMQ_PASS || 'logistics_pass',
  });

  await connection.connect();

  // Create the exchange that the consumer expects
  const channel = connection.getChannel();
  const exchangeName = 'domain_events';
  const deadLetterExchange = `${exchangeName}.dead-letter`;

  // Declare main exchange
  await channel.assertExchange(exchangeName, 'topic', {
    durable: true,
  });

  // Declare dead letter exchange
  await channel.assertExchange(deadLetterExchange, 'topic', {
    durable: true,
  });

  log.ok('RabbitMQ exchanges created');

  const consumer = new RabbitMQConsumer(connection);
  const subscribers = [new StockItemAddedLogger()];

  await consumer.start(subscribers);

  log.ok('Consumer started');
}

startConsumer().catch(error => {
  log.err(`Failed to start consumer: ${error}`);
  process.exit(1);
});

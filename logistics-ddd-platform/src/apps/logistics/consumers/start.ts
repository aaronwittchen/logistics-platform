import 'reflect-metadata';
import { AppDataSource } from '../../../Shared/infrastructure/persistence/TypeOrmConfig';
import { RabbitMQConnection } from '../../../Shared/infrastructure/event-bus/RabbitMQConnection';
import { RabbitMQEventBus } from '../../../Shared/infrastructure/event-bus/RabbitMQEventBus';
import { RabbitMQConsumer } from '../../../Shared/infrastructure/event-bus/RabbitMQConsumer';
import { TypeOrmPackageRepository } from '../../../Contexts/Logistics/Package/infrastructure/persistence/TypeOrmPackageRepository';
import { CreatePackageOnStockReserved } from '../../../Contexts/Logistics/Package/application/subscribers/CreatePackageOnStockReserved';
import { log } from '../../../utils/log';

async function startLogisticsConsumer() {
  await AppDataSource.initialize();

  const rabbitConnection = new RabbitMQConnection({
    hostname: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672'),
    username: process.env.RABBITMQ_USER || 'logistics_user',
    password: process.env.RABBITMQ_PASS || 'logistics_pass',
  });

  await rabbitConnection.connect();

  const eventBus = new RabbitMQEventBus(rabbitConnection);
  const repository = new TypeOrmPackageRepository(eventBus);

  const consumer = new RabbitMQConsumer(rabbitConnection);
  const subscribers = [new CreatePackageOnStockReserved(repository)];

  await consumer.start(subscribers);

  log.ok('Logistics consumer started');
}

startLogisticsConsumer().catch((error) => {
  log.err(`Failed to start logistics consumer: ${error}`);
  process.exit(1);
});
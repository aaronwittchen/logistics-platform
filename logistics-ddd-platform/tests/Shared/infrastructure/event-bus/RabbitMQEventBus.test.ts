import { RabbitMQConnection } from '../../../../src/Shared/infrastructure/event-bus/RabbitMQConnection';
import { RabbitMQEventBus } from '../../../../src/Shared/infrastructure/event-bus/RabbitMQEventBus';
import { StockItemAdded } from '../../../../src/Contexts/Inventory/StockItem/domain/events/StockItemAdded';
import { StockItemId } from '../../../../src/Contexts/Inventory/StockItem/domain/StockItemId';
import { StockItemName } from '../../../../src/Contexts/Inventory/StockItem/domain/StockItemName';
import { Quantity } from '../../../../src/Contexts/Inventory/StockItem/domain/Quantity';

describe('RabbitMQEventBus Integration', () => {
  let connection: RabbitMQConnection;
  let eventBus: RabbitMQEventBus;

  beforeEach(async () => {
    connection = new RabbitMQConnection({
      hostname: 'localhost',
      port: 5672,
      username: 'logistics_user',
      password: 'logistics_pass',
    });

    eventBus = new RabbitMQEventBus(connection);
    await eventBus.start();
  });

  afterEach(async () => {
    await connection.close();
  });

  it('should publish domain event', async () => {
    const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
    const event = new StockItemAdded(
      { aggregateId },
      StockItemName.from('iPhone 15'),
      Quantity.from(100)
    );

    await eventBus.publish([event]);

    // Check RabbitMQ UI to verify message was published
  });
});
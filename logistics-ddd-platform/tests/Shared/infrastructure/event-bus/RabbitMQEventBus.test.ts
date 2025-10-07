import { RabbitMQConnection } from '../../../../src/Shared/infrastructure/event-bus/RabbitMQConnection';
import { RabbitMQEventBus } from '../../../../src/Shared/infrastructure/event-bus/RabbitMQEventBus';
import { StockItemAdded } from '../../../../src/Contexts/Inventory/StockItem/domain/events/StockItemAdded';
import { StockItemId } from '../../../../src/Contexts/Inventory/StockItem/domain/StockItemId';
import { StockItemName } from '../../../../src/Contexts/Inventory/StockItem/domain/StockItemName';
import { Quantity } from '../../../../src/Contexts/Inventory/StockItem/domain/Quantity';

describe('RabbitMQEventBus Integration', () => {
  let connection: RabbitMQConnection;
  let eventBus: RabbitMQEventBus;
  let rabbitMQAvailable = true;

  beforeAll(async () => {
    try {
      connection = new RabbitMQConnection({
        hostname: 'localhost',
        port: 5672,
        username: 'logistics_user',
        password: 'logistics_pass',
      });

      eventBus = new RabbitMQEventBus(connection);
      await eventBus.start();
    } catch (error: unknown) {
      console.warn('RabbitMQ not available, skipping integration tests:', error instanceof Error ? error.message : String(error));
      rabbitMQAvailable = false;
    }
  });

  afterAll(async () => {
    if (rabbitMQAvailable) {
      await connection?.close();
    }
  });

  beforeEach(async () => {
    if (!rabbitMQAvailable) {
      return; // Skip setup if RabbitMQ is not available
    }
    // Setup code here if needed
  });

  it('should publish domain event', async () => {
    if (!rabbitMQAvailable) {
      console.log('Skipping test - RabbitMQ not available');
      return;
    }

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
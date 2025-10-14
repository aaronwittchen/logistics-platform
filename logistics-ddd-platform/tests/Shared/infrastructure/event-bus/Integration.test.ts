import { RabbitMQConnection } from '@/Shared/infrastructure/event-bus/RabbitMQConnection';
import { RabbitMQEventBus } from '@/Shared/infrastructure/event-bus/RabbitMQEventBus';
import { RabbitMQConsumer } from '@/Shared/infrastructure/event-bus/RabbitMQConsumer';
import { StockItemAdded } from '@/Contexts/Inventory/StockItem/domain/events/StockItemAdded';
import { StockItemId } from '@/Contexts/Inventory/StockItem/domain/StockItemId';
import { StockItemName } from '@/Contexts/Inventory/StockItem/domain/StockItemName';
import { Quantity } from '@/Contexts/Inventory/StockItem/domain/Quantity';

class TestEventSubscriber {
  public receivedEvents: StockItemAdded[] = [];

  subscribedTo() {
    return [StockItemAdded];
  }

  async on(event: StockItemAdded) {
    this.receivedEvents.push(event);
  }
}

describe('Event-Driven Architecture Integration', () => {
  let connection: RabbitMQConnection;
  let eventBus: RabbitMQEventBus;
  let consumer: RabbitMQConsumer;
  let subscriber: TestEventSubscriber;
  let rabbitMQAvailable = true;

  beforeAll(async () => {
    try {
      connection = new RabbitMQConnection({
        hostname: process.env.RABBITMQ_HOST || 'localhost',
        port: parseInt(process.env.RABBITMQ_PORT || '5672'),
        username: process.env.RABBITMQ_USER || 'logistics_user',
        password: process.env.RABBITMQ_PASS || 'logistics_pass',
      });

      await connection.connect();

      eventBus = new RabbitMQEventBus(connection, 'integration-test-exchange', {
        maxRetries: 2,
        retryDelay: 100,
        deadLetterExchange: 'integration-test-dlq',
      });

      consumer = new RabbitMQConsumer(connection, 'integration-test-exchange', {
        maxRetries: 2,
        retryDelay: 100,
      });

      subscriber = new TestEventSubscriber();

      await eventBus.start();
      await consumer.start([subscriber]);

    } catch (error) {
      console.warn('RabbitMQ not available for integration tests:', error);
      rabbitMQAvailable = false;
    }
  });

  afterAll(async () => {
    if (rabbitMQAvailable) {
      await connection?.close();
    }
  });

  beforeEach(() => {
    if (!rabbitMQAvailable) {
      return;
    }
    subscriber.receivedEvents = [];
  });

  describe('end-to-end event flow', () => {
    it('should publish and consume events successfully', async () => {
      if (!rabbitMQAvailable) {
        console.log('Skipping integration test - RabbitMQ not available');
        return;
      }

      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const event = new StockItemAdded(
        { aggregateId },
        StockItemName.from('iPhone 15'),
        Quantity.from(100)
      );

      // Publish event
      await eventBus.publish([event]);

      // Wait for consumption
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify event was consumed
      expect(subscriber.receivedEvents).toHaveLength(1);
      expect(subscriber.receivedEvents[0].name).toBe('iPhone 15');
      expect(subscriber.receivedEvents[0].quantity).toBe(100);
      expect(subscriber.receivedEvents[0].aggregateId.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle multiple events correctly', async () => {
      if (!rabbitMQAvailable) {
        console.log('Skipping integration test - RabbitMQ not available');
        return;
      }

      const events = [
        new StockItemAdded(
          { aggregateId: StockItemId.from('550e8400-e29b-41d4-a716-446655440000') },
          StockItemName.from('iPhone 15'),
          Quantity.from(100)
        ),
        new StockItemAdded(
          { aggregateId: StockItemId.from('660e8400-e29b-41d4-a716-446655440000') },
          StockItemName.from('Samsung Galaxy'),
          Quantity.from(50)
        ),
      ];

      // Publish multiple events
      await eventBus.publish(events);

      // Wait for consumption
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify all events were consumed
      expect(subscriber.receivedEvents).toHaveLength(2);
      expect(subscriber.receivedEvents.map(e => e.name)).toContain('iPhone 15');
      expect(subscriber.receivedEvents.map(e => e.name)).toContain('Samsung Galaxy');
    });

    it('should handle event ordering correctly', async () => {
      if (!rabbitMQAvailable) {
        console.log('Skipping integration test - RabbitMQ not available');
        return;
      }

      const events = [
        new StockItemAdded(
          { aggregateId: StockItemId.from('550e8400-e29b-41d4-a716-446655440000') },
          StockItemName.from('First Item'),
          Quantity.from(10)
        ),
        new StockItemAdded(
          { aggregateId: StockItemId.from('660e8400-e29b-41d4-a716-446655440000') },
          StockItemName.from('Second Item'),
          Quantity.from(20)
        ),
      ];

      // Publish events
      await eventBus.publish(events);

      // Wait for consumption
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify events were consumed in order
      expect(subscriber.receivedEvents).toHaveLength(2);
      expect(subscriber.receivedEvents[0].name).toBe('First Item');
      expect(subscriber.receivedEvents[1].name).toBe('Second Item');
    });
  });

  describe('error scenarios', () => {
    it('should handle connection failures gracefully', async () => {
      if (!rabbitMQAvailable) {
        console.log('Skipping integration test - RabbitMQ not available');
        return;
      }

      // Create event bus with failing connection
      const failingConnection = new RabbitMQConnection({
        hostname: 'nonexistent-host',
        port: 5672,
        username: 'test',
        password: 'test',
      });

      const failingEventBus = new RabbitMQEventBus(failingConnection);

      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const event = new StockItemAdded(
        { aggregateId },
        StockItemName.from('Test Item'),
        Quantity.from(10)
      );

      // Should handle connection failure
      await expect(failingEventBus.publish([event])).rejects.toThrow();
    });
  });
});

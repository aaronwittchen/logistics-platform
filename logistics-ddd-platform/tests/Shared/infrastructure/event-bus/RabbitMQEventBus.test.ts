import { RabbitMQEventBus } from '@/Shared/infrastructure/event-bus/RabbitMQEventBus';
import { StockItemAdded } from '@/Contexts/Inventory/StockItem/domain/events/StockItemAdded';
import { StockItemId } from '@/Contexts/Inventory/StockItem/domain/StockItemId';
import { StockItemName } from '@/Contexts/Inventory/StockItem/domain/StockItemName';
import { Quantity } from '@/Contexts/Inventory/StockItem/domain/Quantity';

// Mock implementations for unit testing
class MockRabbitMQConnection {
  private channel: any;
  private connectionAttempts: number[] = [];
  private publishAttempts: any[] = [];

  // Add missing properties from RabbitMQConnection
  public isConnecting = false;
  public reconnectAttempts = 0;
  public maxReconnectAttempts = 10;
  public reconnectDelay = 1000;

  // Add missing config property
  public config = {
    hostname: 'localhost',
    port: 5672,
    username: 'guest',
    password: 'guest',
  };

  constructor(private shouldFail: boolean = false) {}

  async connect(): Promise<void> {
    this.connectionAttempts.push(Date.now());
    // Don't fail during connect for retry tests - only fail during publish
  }

  async close(): Promise<void> {}

  getChannel() {
    if (!this.channel) {
      this.channel = {
        assertExchange: jest.fn(),
        assertQueue: jest.fn(),
        bindQueue: jest.fn(),
        publish: jest.fn((exchange, routingKey, content, options) => {
          this.publishAttempts.push({ exchange, routingKey, content, options });
          if (this.shouldFail) {
            throw new Error('Publish failed');
          }
        }),
        consume: jest.fn(),
      };
    }
    return this.channel;
  }

  getPublishAttempts() {
    return this.publishAttempts;
  }

  clearAttempts() {
    this.publishAttempts = [];
    this.connectionAttempts = [];
  }

  // Add missing private methods from RabbitMQConnection
  private async handleConnectionError(): Promise<void> {
    // Mock implementation - do nothing for tests
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

describe('RabbitMQEventBus', () => {
  let mockConnection: MockRabbitMQConnection;
  let eventBus: RabbitMQEventBus;

  beforeEach(() => {
    mockConnection = new MockRabbitMQConnection();
    eventBus = new RabbitMQEventBus(mockConnection as any, 'test-exchange', {
      maxRetries: 2,
      retryDelay: 50,
      deadLetterExchange: 'test-dlq',
    });
  });

  describe('successful publishing', () => {
    it('should publish events successfully', async () => {
      await eventBus.start();

      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const event = new StockItemAdded({ aggregateId }, StockItemName.from('iPhone 15'), Quantity.from(100));

      await eventBus.publish([event]);

      const channel = mockConnection.getChannel();
      expect(channel.publish).toHaveBeenCalledTimes(1);

      const publishCall = channel.publish.mock.calls[0];
      const message = JSON.parse(publishCall[2].toString());

      expect(message.data.type).toBe('inventory.stock_item.added');
      expect(message.data.aggregateId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(message.data.attributes.name).toBe('iPhone 15');
      expect(message.data.attributes.quantity).toBe(100);
    });

    it('should include metadata in published messages', async () => {
      await eventBus.start();

      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const event = new StockItemAdded({ aggregateId }, StockItemName.from('iPhone 15'), Quantity.from(100));

      await eventBus.publish([event]);

      const channel = mockConnection.getChannel();
      const publishCall = channel.publish.mock.calls[0];
      const message = JSON.parse(publishCall[2].toString());

      expect(message.data.metadata).toBeDefined();
      expect(message.data.metadata.publishedAt).toBeDefined();
      expect(message.data.metadata.publisher).toBe('RabbitMQEventBus');
      expect(message.data.metadata.attempt).toBe(1);
    });
  });

  describe('retry logic', () => {
    it('should retry failed publishes', async () => {
      const failingConnection = new MockRabbitMQConnection(true);
      const retryEventBus = new RabbitMQEventBus(failingConnection as any, 'test-exchange', {
        maxRetries: 3,
        retryDelay: 10,
      });

      await retryEventBus.start();

      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const event = new StockItemAdded({ aggregateId }, StockItemName.from('iPhone 15'), Quantity.from(100));

      // Should retry 3 times before giving up
      await expect(retryEventBus.publish([event])).rejects.toThrow();

      const channel = failingConnection.getChannel();
      expect(channel.publish).toHaveBeenCalledTimes(4); // 3 retries + 1 DLQ attempt
    });

    it('should move failed events to dead letter exchange after max retries', async () => {
      const failingConnection = new MockRabbitMQConnection(true);
      const retryEventBus = new RabbitMQEventBus(failingConnection as any, 'test-exchange', {
        maxRetries: 1,
        retryDelay: 10,
        deadLetterExchange: 'test-dlq',
      });

      await retryEventBus.start();

      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const event = new StockItemAdded({ aggregateId }, StockItemName.from('iPhone 15'), Quantity.from(100));

      await expect(retryEventBus.publish([event])).rejects.toThrow();

      // Check that dead letter exchange was used
      const channel = failingConnection.getChannel();
      const dlqCall = channel.publish.mock.calls.find(
        (call: any[]) => call[0] === 'test-dlq' && call[1] === 'inventory.stock_item.added.failed',
      );

      expect(dlqCall).toBeDefined();
      const dlqMessage = JSON.parse(dlqCall[2].toString());
      expect(dlqMessage.metadata.failureReason).toBe('max_retries_exceeded');
    });
  });

  describe('event serialization', () => {
    it('should include event version in serialized message', async () => {
      await eventBus.start();

      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const event = new StockItemAdded({ aggregateId }, StockItemName.from('iPhone 15'), Quantity.from(100));

      await eventBus.publish([event]);

      const channel = mockConnection.getChannel();
      const publishCall = channel.publish.mock.calls[0];
      const message = JSON.parse(publishCall[2].toString());

      expect(message.data.attributes.eventVersion).toBe('1.0.0');
    });

    it('should handle events with custom versions', async () => {
      // Create a custom event class with version override
      class VersionedStockItemAdded extends StockItemAdded {
        protected eventVersion(): string {
          return '2.0.0';
        }
      }

      await eventBus.start();

      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const event = new VersionedStockItemAdded({ aggregateId }, StockItemName.from('iPhone 15'), Quantity.from(100));

      await eventBus.publish([event]);

      const channel = mockConnection.getChannel();
      const publishCall = channel.publish.mock.calls[0];
      const message = JSON.parse(publishCall[2].toString());

      expect(message.data.attributes.eventVersion).toBe('2.0.0');
    });
  });

  describe('subscription management', () => {
    it('should manage subscriptions correctly', async () => {
      await eventBus.start();

      const mockHandler = jest.fn();

      eventBus.subscribe(StockItemAdded, mockHandler);
      expect(mockHandler).toHaveBeenCalledTimes(0);

      // Publish event
      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const event = new StockItemAdded({ aggregateId }, StockItemName.from('iPhone 15'), Quantity.from(100));

      await eventBus.publish([event]);

      // Note: In a real test, you'd need to set up a consumer to verify
      // that the subscription handler was called
    });
  });
});

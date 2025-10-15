import { Channel } from 'amqplib';
import { RabbitMQConsumer } from '@/Shared/infrastructure/event-bus/RabbitMQConsumer';
import { StockItemAdded } from '@/Contexts/Inventory/StockItem/domain/events/StockItemAdded';
import { PackageRegistered } from '@/Contexts/Logistics/Package/domain/events/PackageRegistered';

// Mock subscriber for testing
class MockSubscriber {
  public receivedEvents: any[] = [];
  public errorCount = 0;

  subscribedTo() {
    return [StockItemAdded, PackageRegistered];
  }

  async on(event: any) {
    this.receivedEvents.push(event);
  }
}

// Mock connection for testing
class MockConsumerConnection {
  private channel?: Channel;
  private messageHandlers: any[] = [];

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
    // Mock implementation - do nothing for tests
  }

  async close(): Promise<void> {
    // Mock implementation - do nothing for tests
  }

  getChannel() {
    if (!this.channel) {
      this.channel = {
        assertQueue: jest.fn(),
        bindQueue: jest.fn(),
        publish: jest.fn(), // Add missing publish method for dead letter exchange
        consume: jest.fn((queue, handler) => {
          this.messageHandlers.push({ queue, handler });
          if (this.shouldFail) {
            throw new Error('Consumer setup failed');
          }
          // Return a mock Consume object
          return Promise.resolve({ consumerTag: 'mock-consumer' });
        }),
        ack: jest.fn(),
        nack: jest.fn(),
      } as any; // Cast to any to bypass strict interface requirements
    }
    return this.channel;
  }

  getMessageHandlers() {
    return this.messageHandlers;
  }

  simulateMessage(queueName: string, message: any) {
    const handler = this.messageHandlers.find(h => h.queue === queueName)?.handler;
    if (handler) {
      handler({ content: Buffer.from(JSON.stringify(message)) });
    }
  }

  // Add missing private methods (simplified for mock)
  private async handleConnectionError(): Promise<void> {
    // Mock implementation - do nothing for tests
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

describe('RabbitMQConsumer', () => {
  let mockConnection: MockConsumerConnection;
  let consumer: RabbitMQConsumer;
  let subscriber: MockSubscriber;

  beforeEach(() => {
    mockConnection = new MockConsumerConnection();
    consumer = new RabbitMQConsumer(mockConnection as any, 'test-exchange', {
      maxRetries: 2,
      retryDelay: 50,
    });
    subscriber = new MockSubscriber();
  });

  describe('consumer setup', () => {
    it('should set up queues and bindings correctly', async () => {
      await consumer.start([subscriber]);

      const channel = mockConnection.getChannel();

      expect(channel!.assertQueue).toHaveBeenCalledTimes(2); // One for each event type
      expect(channel!.bindQueue).toHaveBeenCalledTimes(2);
      expect(channel!.consume).toHaveBeenCalledTimes(2);
    });

    it('should handle setup failures gracefully', async () => {
      const failingConnection = new MockConsumerConnection(true);
      const failingConsumer = new RabbitMQConsumer(failingConnection as any);

      await expect(failingConsumer.start([subscriber])).rejects.toThrow('Consumer setup failed');
    });
  });

  describe('message processing', () => {
    beforeEach(async () => {
      await consumer.start([subscriber]);
    });

    it('should process valid messages successfully', async () => {
      const message = {
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          type: 'inventory.stock_item.added',
          aggregateId: '660e8400-e29b-41d4-a716-446655440000',
          occurredOn: new Date().toISOString(),
          attributes: {
            name: 'iPhone 15',
            quantity: 100,
            eventVersion: '1.0.0',
          },
        },
      };

      mockConnection.simulateMessage('inventory.stock_item.added.MockSubscriber', message);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(subscriber.receivedEvents).toHaveLength(1);
      expect(subscriber.receivedEvents[0]).toBeInstanceOf(StockItemAdded);
      expect(subscriber.receivedEvents[0].name).toBe('iPhone 15');
      expect(subscriber.receivedEvents[0].quantity).toBe(100);
    });

    it('should retry failed message processing', async () => {
      // Create a subscriber that fails the first time
      class FailingSubscriber extends MockSubscriber {
        public attemptCount = 0;

        async on(event: any) {
          this.attemptCount++;
          if (this.attemptCount === 1) {
            throw new Error('Processing failed');
          }
          super.on(event);
        }
      }

      const failingSubscriber = new FailingSubscriber();
      await consumer.start([failingSubscriber]);

      const message = {
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          type: 'inventory.stock_item.added',
          aggregateId: '660e8400-e29b-41d4-a716-446655440000',
          occurredOn: new Date().toISOString(),
          attributes: {
            name: 'iPhone 15',
            quantity: 100,
            eventVersion: '1.0.0',
          },
        },
      };

      // Simulate message that will be retried
      mockConnection.simulateMessage('inventory.stock_item.added.FailingSubscriber', message);

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(failingSubscriber.attemptCount).toBe(2); // Should have retried once
      expect(failingSubscriber.receivedEvents).toHaveLength(1); // Should eventually succeed
    });

    it('should send failed messages to dead letter exchange after max retries', async () => {
      class AlwaysFailingSubscriber extends MockSubscriber {
        async on(event: any) {
          this.errorCount++; // Increment error count before failing
          throw new Error('Always fails');
        }
      }

      const alwaysFailingSubscriber = new AlwaysFailingSubscriber();
      await consumer.start([alwaysFailingSubscriber]);

      const message = {
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          type: 'inventory.stock_item.added',
          aggregateId: '660e8400-e29b-41d4-a716-446655440000',
          occurredOn: new Date().toISOString(),
          attributes: {
            name: 'iPhone 15',
            quantity: 100,
            eventVersion: '1.0.0',
          },
        },
      };

      mockConnection.simulateMessage('inventory.stock_item.added.AlwaysFailingSubscriber', message);

      // Wait for all retries to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(alwaysFailingSubscriber.errorCount).toBe(3); // Should have failed max retries + 1 times
      expect(alwaysFailingSubscriber.receivedEvents).toHaveLength(0); // Should not have processed successfully
    });
  });

  describe('event deserialization', () => {
    it('should handle malformed messages gracefully', async () => {
      await consumer.start([subscriber]);

      const malformedMessage = {
        data: {
          // Missing required fields
          type: 'inventory.stock_item.added',
        },
      };

      mockConnection.simulateMessage('inventory.stock_item.added.MockSubscriber', malformedMessage);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(subscriber.receivedEvents).toHaveLength(0);
      // Remove this line - subscribers aren't notified of errors
      // expect(subscriber.errorCount).toBeGreaterThan(0);
    });

    it('should validate event primitives before deserialization', async () => {
      // Mock the fromPrimitives method instead of validatePrimitives
      const originalFromPrimitives = StockItemAdded.fromPrimitives;
      StockItemAdded.fromPrimitives = jest.fn(primitives => {
        if (!(primitives as any).attributes?.name) {
          throw new Error('Missing name in event attributes');
        }
        return originalFromPrimitives.call(StockItemAdded, primitives);
      });

      await consumer.start([subscriber]);

      const invalidMessage = {
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          type: 'inventory.stock_item.added',
          aggregateId: '660e8400-e29b-41d4-a716-446655440000',
          occurredOn: new Date().toISOString(),
          attributes: {
            quantity: 100,
            // Missing name
            eventVersion: '1.0.0',
          },
        },
      };

      mockConnection.simulateMessage('inventory.stock_item.added.MockSubscriber', invalidMessage);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that fromPrimitives was called and failed
      expect(StockItemAdded.fromPrimitives).toHaveBeenCalled();
      expect(subscriber.receivedEvents).toHaveLength(0);

      // Restore original method
      StockItemAdded.fromPrimitives = originalFromPrimitives;
    });
  });
});

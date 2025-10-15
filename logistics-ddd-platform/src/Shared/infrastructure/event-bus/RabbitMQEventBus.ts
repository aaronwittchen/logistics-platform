import { EventBus, DomainEventClass, DomainEventHandler } from '@/Shared/domain/EventBus';
import { DomainEvent } from '@/Shared/domain/DomainEvent';
import { RabbitMQConnection } from './RabbitMQConnection';
import { log } from '@/utils/log';

interface PublishOptions {
  maxRetries?: number;
  retryDelay?: number;
  deadLetterExchange?: string;
}

// ... existing code ...

export class RabbitMQEventBus implements EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly subscriptions = new Map<string, Set<DomainEventHandler<any>>>();
  private readonly deadLetterExchange: string;

  // ... existing code ...

  constructor(
    private readonly connection: RabbitMQConnection,
    private readonly exchangeName: string = 'domain_events',
    private readonly options: PublishOptions = {},
  ) {
    this.deadLetterExchange = options.deadLetterExchange || `${exchangeName}.dead-letter`;
  }

  async start(): Promise<void> {
    await this.connection.connect();
    const channel = this.connection.getChannel();

    // Declare main exchange
    await channel.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });

    // Declare dead letter exchange
    await channel.assertExchange(this.deadLetterExchange, 'topic', {
      durable: true,
    });

    // Declare queue for domain events
    const queueName = `${this.exchangeName}.queue`;
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': this.deadLetterExchange,
        'x-message-ttl': 300000, // 5 minutes TTL
      },
    });

    // Bind queue to exchange with wildcard pattern to receive all events
    await channel.bindQueue(queueName, this.exchangeName, '#');

    log.ok(`EventBus started on exchange: ${this.exchangeName} with queue: ${queueName}`);
  }

  async publish(events: DomainEvent[]): Promise<void> {
    const channel = this.connection.getChannel();
    const maxRetries = this.options.maxRetries || 3;
    const retryDelay = this.options.retryDelay || 1000;

    for (const event of events) {
      let attempt = 0;
      let published = false;

      while (attempt < maxRetries && !published) {
        try {
          const routingKey = event.eventName();
          const message = JSON.stringify({
            data: {
              id: event.eventId.value,
              type: event.eventName(),
              aggregateId: event.aggregateId.value,
              occurredOn: event.occurredOn.toISOString(),
              attributes: event.toPrimitives(),
              metadata: {
                publishedAt: new Date().toISOString(),
                publisher: 'RabbitMQEventBus',
                attempt: attempt + 1,
              },
            },
          });

          channel.publish(this.exchangeName, routingKey, Buffer.from(message), {
            persistent: true,
            timestamp: Date.now(),
            messageId: event.eventId.value,
          });

          published = true;
          log.info(`Published event: ${event.eventName()} (attempt ${attempt + 1})`);
        } catch (error) {
          attempt++;
          log.err(`Failed to publish event ${event.eventName()} (attempt ${attempt}): ${error}`);

          if (attempt >= maxRetries) {
            await this.handlePublishFailure(event, error as Error);
          } else {
            await this.delay(retryDelay * attempt);
          }
        }
      }
    }
  }

  private async handlePublishFailure(event: DomainEvent, error: Error): Promise<void> {
    log.err(`Event ${event.eventName()} permanently failed after retries. Sending to dead letter exchange.`);

    try {
      const channel = this.connection.getChannel();
      const deadLetterMessage = JSON.stringify({
        data: event.toPrimitives(),
        error: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        },
        metadata: {
          originalEventId: event.eventId.value,
          failureReason: 'max_retries_exceeded',
        },
      });

      channel.publish(this.deadLetterExchange, `${event.eventName()}.failed`, Buffer.from(deadLetterMessage), {
        persistent: true,
      });
    } catch (dlqError) {
      log.err(`Failed to send event to dead letter exchange: ${dlqError}`);
      // Throw the original error if DLQ publishing also fails
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  subscribe<T extends DomainEvent>(event: DomainEventClass<T>, handler: DomainEventHandler<T>): void {
    const eventName = event.prototype.eventName();

    if (!this.subscriptions.has(eventName)) {
      this.subscriptions.set(eventName, new Set());
    }

    this.subscriptions.get(eventName)!.add(handler);

    log.ok(`Subscribed to event: ${eventName}`);
  }

  unsubscribe<T extends DomainEvent>(event: DomainEventClass<T>, handler: DomainEventHandler<T>): void {
    const eventName = event.prototype.eventName();
    const handlers = this.subscriptions.get(eventName);

    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(eventName);
      }
    }

    log.info(`Unsubscribed from event: ${eventName}`);
  }
}

import { EventBus, DomainEventClass, DomainEventHandler } from '../../domain/EventBus';
import { DomainEvent } from '../../domain/DomainEvent';
import { RabbitMQConnection } from './RabbitMQConnection';
import { log } from '@/utils/log';

export class RabbitMQEventBus implements EventBus {
    private readonly subscriptions = new Map<string, Set<DomainEventHandler<any>>>();

  constructor(
    private readonly connection: RabbitMQConnection,
    private readonly exchangeName: string = 'domain_events'
  ) {}

  async start(): Promise<void> {
    await this.connection.connect();
    const channel = this.connection.getChannel();

    // Declare exchange
    await channel.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });

    // Declare queue for domain events
    const queueName = `${this.exchangeName}.queue`;
    await channel.assertQueue(queueName, {
      durable: true,
    });

    // Bind queue to exchange with wildcard pattern to receive all events
    await channel.bindQueue(queueName, this.exchangeName, '#');

    log.ok(`EventBus started on exchange: ${this.exchangeName} with queue: ${queueName}`);
  }

  async publish(events: DomainEvent[]): Promise<void> {
    const channel = this.connection.getChannel();

    for (const event of events) {
      const routingKey = event.eventName();
      const message = JSON.stringify({
        data: {
          id: event.eventId.value,
          type: event.eventName(),
          aggregateId: event.aggregateId.value,
          occurredOn: event.occurredOn.toISOString(),
          attributes: event.toPrimitives(),
        },
      });

      channel.publish(this.exchangeName, routingKey, Buffer.from(message), {
        persistent: true,
      });

      log.info(`Published event: ${event.eventName}`);
    }
  }

  subscribe<T extends DomainEvent>(
    event: DomainEventClass<T>,
    handler: DomainEventHandler<T>
  ): void {
    const eventName = event.prototype.eventName();

    if (!this.subscriptions.has(eventName)) {
      this.subscriptions.set(eventName, new Set());
    }

    this.subscriptions.get(eventName)!.add(handler);

    log.ok(`Subscribed to event: ${eventName}`);
  }

  unsubscribe<T extends DomainEvent>(
    event: DomainEventClass<T>,
    handler: DomainEventHandler<T>
  ): void {
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
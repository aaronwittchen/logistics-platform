import { DomainEvent } from '../../domain/DomainEvent';
import { DomainEventSubscriber } from '../../domain/DomainEventSubscriber';
import { RabbitMQConnection } from './RabbitMQConnection';
import { log } from '../../utils/log';

export class RabbitMQConsumer {
  constructor(
    private readonly connection: RabbitMQConnection,
    private readonly exchangeName: string = 'domain_events'
  ) {}

  async start(
    subscribers: Array<DomainEventSubscriber<DomainEvent>>
  ): Promise<void> {
    const channel = this.connection.getChannel();

    for (const subscriber of subscribers) {
      const eventClasses = subscriber.subscribedTo();

      for (const eventClass of eventClasses) {
        const queueName = `${eventClass.EVENT_NAME}.${subscriber.constructor.name}`;

        // Create queue
        await channel.assertQueue(queueName, { durable: true });

        // Bind queue to exchange
        await channel.bindQueue(
          queueName,
          this.exchangeName,
          eventClass.EVENT_NAME
        );

        // Consume messages
        await channel.consume(queueName, async (msg) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());

            // Handle different message formats
            const eventData = content.data || content;

            log.info(`Received message: ${JSON.stringify(content, null, 2)}`);

            const event = eventClass.fromPrimitives(eventData);

            await subscriber.on(event);

            channel.ack(msg);
            log.ok(`Processed event: ${eventClass.EVENT_NAME}`);
          } catch (error) {
            log.err(`Error processing event: ${error}`);
          }
        });

        log.info(`Listening to: ${eventClass.EVENT_NAME}`);
      }
    }
  }
}
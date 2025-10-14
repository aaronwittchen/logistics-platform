import { DomainEvent } from '../../domain/DomainEvent';
import { DomainEventSubscriber } from '../../domain/DomainEventSubscriber';
import { RabbitMQConnection } from './RabbitMQConnection';
import { log } from '@/utils/log';

interface ConsumerOptions {
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
}

export class RabbitMQConsumer {
  private readonly deadLetterExchange: string;

  constructor(
    private readonly connection: RabbitMQConnection,
    private readonly exchangeName: string = 'domain_events',
    private readonly options: ConsumerOptions = {}
  ) {
    this.deadLetterExchange = `${exchangeName}.dead-letter`;
  }

  async start(
    subscribers: Array<DomainEventSubscriber<DomainEvent>>
  ): Promise<void> {
    const channel = this.connection.getChannel();
    const maxRetries = this.options.maxRetries || 3;
    const retryDelay = this.options.retryDelay || 1000;

    for (const subscriber of subscribers) {
      const eventClasses = subscriber.subscribedTo();

      for (const eventClass of eventClasses) {
        const queueName = `${eventClass.EVENT_NAME}.${subscriber.constructor.name}`;

        // Create main queue
        await channel.assertQueue(queueName, { 
          durable: true,
          arguments: {
            'x-dead-letter-exchange': this.deadLetterExchange,
            'x-message-ttl': 300000, // 5 minutes TTL
          },
        });

        // Bind queue to exchange
        await channel.bindQueue(
          queueName,
          this.exchangeName,
          eventClass.EVENT_NAME
        );

        // Consume messages with retry logic
        await channel.consume(queueName, async (msg) => {
          if (!msg) return;

          let attempt = 0;
          const maxAttempts = maxRetries + 1;

          while (attempt < maxAttempts) {
            try {
              const content = JSON.parse(msg.content.toString());
              const eventData = content.data || content;

              log.info(`Processing event: ${eventClass.EVENT_NAME} (attempt ${attempt + 1})`);

              const event = eventClass.fromPrimitives(eventData);
              await subscriber.on(event);

              channel.ack(msg);
              log.ok(`Successfully processed event: ${eventClass.EVENT_NAME}`);
              return;

            } catch (error) {
              attempt++;
              log.err(`Error processing event ${eventClass.EVENT_NAME} (attempt ${attempt}): ${error}`);

              if (attempt >= maxAttempts) {
                await this.handleConsumptionFailure(msg, error as Error, eventClass.EVENT_NAME);
                try {
                  channel.nack(msg, false, false); // Don't requeue
                } catch (nackError) {
                  if (nackError && typeof nackError === 'object' && 'message' in nackError && 'name' in nackError) {
                    const error = nackError as { message?: string; name?: string };
                    if (error.message?.includes('unknown delivery tag') || error.name === 'IllegalOperationError') {
                      log.warn(`Message already acknowledged, cannot nack: ${eventClass.EVENT_NAME}`);
                    } else {
                      throw nackError;
                    }
                  } else {
                    throw nackError;
                  }
                }
                return;
              } else {
                // Requeue for retry
                try {
                  channel.nack(msg, false, true);
                } catch (nackError) {
                  if (nackError && typeof nackError === 'object' && 'message' in nackError && 'name' in nackError) {
                    const error = nackError as { message?: string; name?: string };
                    if (error.message?.includes('unknown delivery tag') || error.name === 'IllegalOperationError') {
                      log.warn(`Message already acknowledged, cannot requeue: ${eventClass.EVENT_NAME}`);
                      return; // Exit since message is already processed
                    }
                  }
                  throw nackError;
                }
                await this.delay(retryDelay * attempt);
              }
            }
          }
        });

        log.info(`Listening to: ${eventClass.EVENT_NAME}`);
      }
    }
  }

  private async handleConsumptionFailure(
    msg: any, 
    error: Error, 
    eventName: string
  ): Promise<void> {
    log.err(`Event ${eventName} permanently failed after retries. Sending to dead letter exchange.`);

    try {
      const channel = this.connection.getChannel();
      const deadLetterMessage = JSON.stringify({
        data: msg.content ? JSON.parse(msg.content.toString()) : null,
        error: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        },
        metadata: {
          originalMessageId: msg.properties?.messageId,
          failureReason: 'max_retries_exceeded',
        },
      });

      channel.publish(
        this.deadLetterExchange,
        `${eventName}.failed`,
        Buffer.from(deadLetterMessage),
        { persistent: true }
      );
    } catch (dlqError) {
      log.err(`Failed to send failed event to dead letter exchange: ${dlqError}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
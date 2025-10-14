import amqp, { Channel, Connection } from 'amqplib';
import { log } from '@/utils/log';

export class RabbitMQConnection {
  private connection?: Connection;
  private channel?: Channel;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;

  constructor(
    private readonly config: {
      hostname: string;
      port: number;
      username: string;
      password: string;
    }
  ) {}

  async connect(): Promise<void> {
    if (this.connection && this.channel) {
      return; // Already connected
    }

    if (this.isConnecting) {
      // Wait for ongoing connection attempt
      while (this.isConnecting) {
        await this.delay(100);
      }
      return;
    }

    this.isConnecting = true;

    try {
      const { hostname, port, username, password } = this.config;

      this.connection = await amqp.connect({
        hostname,
        port,
        username,
        password,
      });

      this.connection.on('error', (error) => {
        log.err(`RabbitMQ connection error: ${error}`);
        this.handleConnectionError();
      });

      this.connection.on('close', () => {
        log.warn('RabbitMQ connection closed');
        this.handleConnectionError();
      });

      this.channel = await this.connection.createChannel();
      this.reconnectAttempts = 0;
      this.isConnecting = false;

      log.ok('RabbitMQ connected');
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  private async handleConnectionError(): Promise<void> {
    this.connection = undefined;
    this.channel = undefined;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      log.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(async () => {
        try {
          await this.connect();
        } catch (error) {
          log.err(`Reconnection failed: ${error}`);
        }
      }, delay);
    } else {
      log.err('Max reconnection attempts reached');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    log.info('RabbitMQ connection closed');
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel;
  }
}
import amqp, { Channel, Connection } from 'amqplib';

export class RabbitMQConnection {
  private connection?: Connection;
  private channel?: Channel;

  constructor(
    private readonly config: {
      hostname: string;
      port: number;
      username: string;
      password: string;
    }
  ) {}

  async connect(): Promise<void> {
    const { hostname, port, username, password } = this.config;

    this.connection = await amqp.connect({
      hostname,
      port,
      username,
      password,
    });

    this.channel = await this.connection.createChannel();

    console.log('✅ RabbitMQ connected');
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    console.log('❌ RabbitMQ connection closed');
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel;
  }
}
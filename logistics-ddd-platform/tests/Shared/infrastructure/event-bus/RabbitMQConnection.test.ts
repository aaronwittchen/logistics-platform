import { RabbitMQConnection } from '../../../../src/Shared/infrastructure/event-bus/RabbitMQConnection';

describe('RabbitMQConnection Integration', () => {
  let connection: RabbitMQConnection;

  beforeEach(() => {
    connection = new RabbitMQConnection({
      hostname: 'localhost',
      port: 5672,
      username: 'logistics_user',
      password: 'logistics_pass',
    });
  });

  afterEach(async () => {
    await connection.close();
  });

  it('should connect to RabbitMQ', async () => {
    await connection.connect();
    const channel = connection.getChannel();
    expect(channel).toBeDefined();
  });
});
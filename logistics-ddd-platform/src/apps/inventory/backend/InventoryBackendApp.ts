import "reflect-metadata";
import { HttpServer } from '../../../Shared/infrastructure/http/HttpServer';
import { AppDataSource } from '../../../Shared/infrastructure/persistence/TypeOrmConfig';
import { RabbitMQConnection } from '../../../Shared/infrastructure/event-bus/RabbitMQConnection';
import { createStockItemsRouter } from './routes/stock-items.route';
import { RabbitMQEventBus } from '../../../Shared/infrastructure/event-bus/RabbitMQEventBus';
import { log } from '../../../utils/log';

/**
 * Utility to read environment variables with an optional fallback
 */
function env(name: string, fallback?: string): string | undefined {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

export class InventoryBackendApp {
  private server: HttpServer;
  private eventBus?: RabbitMQEventBus;

  constructor() {
    this.server = new HttpServer(3000);

    // Only create EventBus if RabbitMQ is available
    try {
      const rabbitConnection = new RabbitMQConnection({
        hostname: env('RABBITMQ_HOST', 'localhost')!,
        port: Number(env('RABBITMQ_PORT', '5672')),
        username: env('RABBITMQ_USER', 'logistics_user')!,
        password: env('RABBITMQ_PASS', 'logistics_pass')!,
      });

      this.eventBus = new RabbitMQEventBus(rabbitConnection);
      log.ok('EventBus initialized successfully');
    } catch (error: unknown) {
      log.warn(`EventBus initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      log.info('Continuing without event publishing capability');
      this.eventBus = undefined;
    }
  }

  async start(): Promise<void> {
    try {
      log.load('Connecting to database...');
      await this.connectDatabase();
      
      log.load('Registering routes...');
      this.registerRoutes();
      
      if (this.eventBus) {
        log.load('Starting EventBus...');
        try {
          await this.eventBus.start();
          log.ok('EventBus connected');
        } catch (error: unknown) {
          log.warn(`EventBus connection failed: ${error instanceof Error ? error.message : String(error)}`);
          this.eventBus = undefined; // Disable EventBus if connection fails
        }
      }
      
      log.load('Starting HTTP server...');
      await this.server.start();
      
      log.ok('Inventory backend started successfully');
    } catch (error) {
      log.err(`Failed to start inventory backend: ${error}`);
      throw error;
    }
  }

  private async connectDatabase(): Promise<void> {
    try {
      await AppDataSource.initialize();
      log.ok('Database connected');
    } catch (error) {
      log.err(`Database connection failed: ${error}`);
      throw error;
    }
  }

  private registerRoutes(): void {
    try {
      const stockItemsRouter = createStockItemsRouter(this.eventBus);
      this.server.registerRouter(stockItemsRouter);
      log.ok('Routes registered');
    } catch (error) {
      log.err(`Route registration failed: ${error}`);
      throw error;
    }
  }
}
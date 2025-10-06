import "reflect-metadata";
import { HttpServer } from '../../../Shared/infrastructure/http/HttpServer';
import { AppDataSource } from '../../../Shared/infrastructure/persistence/TypeOrmConfig';
import { RabbitMQConnection } from '../../../Shared/infrastructure/event-bus/RabbitMQConnection';
import { createStockItemsRouter } from './routes/stock-items.route';
import { RabbitMQEventBus } from '../../../Shared/infrastructure/event-bus/RabbitMQEventBus';

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
      console.log('✅ EventBus initialized successfully');
    } catch (error: unknown) {
      console.warn('⚠️ EventBus initialization failed:', error instanceof Error ? error.message : String(error));
      console.warn('📝 Continuing without event publishing capability');
      this.eventBus = undefined;
    }
  }

  async start(): Promise<void> {
    try {
      console.log('🔄 Connecting to database...');
      await this.connectDatabase();
      
      console.log('🔄 Registering routes...');
      this.registerRoutes();
      
      if (this.eventBus) {
        console.log('🔄 Starting EventBus...');
        try {
          await this.eventBus.start();
          console.log('✅ EventBus connected');
        } catch (error: unknown) {
          console.warn('⚠️ EventBus connection failed:', error instanceof Error ? error.message : String(error));
          this.eventBus = undefined; // Disable EventBus if connection fails
        }
      }
      
      console.log('🔄 Starting HTTP server...');
      await this.server.start();
      
      console.log('✅ Inventory backend started successfully');
    } catch (error) {
      console.error('❌ Failed to start inventory backend:', error);
      throw error;
    }
  }

  private async connectDatabase(): Promise<void> {
    try {
      await AppDataSource.initialize();
      console.log('✅ Database connected');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  private registerRoutes(): void {
    try {
      const stockItemsRouter = createStockItemsRouter(this.eventBus);
      this.server.registerRouter(stockItemsRouter);
      console.log('✅ Routes registered');
    } catch (error) {
      console.error('❌ Route registration failed:', error);
      throw error;
    }
  }
}



import 'reflect-metadata';
import { AppDataSource } from '../../../Shared/infrastructure/persistence/TypeOrmConfig';
import { RabbitMQConnection } from '../../../Shared/infrastructure/event-bus/RabbitMQConnection';
import { RabbitMQEventBus } from '../../../Shared/infrastructure/event-bus/RabbitMQEventBus';
import { RabbitMQConsumer } from '../../../Shared/infrastructure/event-bus/RabbitMQConsumer';
import { CircuitBreaker } from '../../../Shared/infrastructure/event-bus/CircuitBreaker';
import { EventRegistry } from '../../../Shared/infrastructure/event-bus/EventRegistry';
import { TypeOrmPackageRepository } from '../../../Contexts/Logistics/Package/infrastructure/persistence/TypeOrmPackageRepository';
import { CreatePackageOnStockReserved } from '../../../Contexts/Logistics/Package/application/subscribers/CreatePackageOnStockReserved';
import { PackageDeliveryTracker } from '../../../Contexts/Logistics/Package/application/subscribers/PackageDeliveryTracker';
import { PackageStatusUpdater } from '@/Contexts/Logistics/Package/application/subscribers/PackageStatusUpdater';
import { InventoryReservationMonitor } from '@/Contexts/Logistics/Package/application/subscribers/InventoryReservationMonitor';
import { Package } from '../../../Contexts/Logistics/Package/domain/Package';
import { PackageId } from '../../../Contexts/Logistics/Package/domain/PackageId';
import { TrackingNumber } from '../../../Contexts/Logistics/Package/domain/TrackingNumber';
import { log } from '@/utils/log';

// Enhanced configuration interface
interface ConsumerConfig {
  rabbitMQ: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    vhost?: string;
  };
  consumer: {
    maxRetries: number;
    retryDelay: number;
    batchSize: number;
    prefetchCount: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    successThreshold: number;
  };
  monitoring: {
    metricsPort: number;
    healthCheckInterval: number;
  };
}

// Load configuration from environment variables with defaults
const config: ConsumerConfig = {
  rabbitMQ: {
    hostname: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672'),
    username: process.env.RABBITMQ_USER || 'logistics_user',
    password: process.env.RABBITMQ_PASS || 'logistics_pass',
    vhost: process.env.RABBITMQ_VHOST || '/',
  },
  consumer: {
    maxRetries: parseInt(process.env.CONSUMER_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.CONSUMER_RETRY_DELAY || '1000'),
    batchSize: parseInt(process.env.CONSUMER_BATCH_SIZE || '10'),
    prefetchCount: parseInt(process.env.CONSUMER_PREFETCH_COUNT || '1'),
  },
  circuitBreaker: {
    failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5'),
    recoveryTimeout: parseInt(process.env.CIRCUIT_BREAKER_RECOVERY_TIMEOUT || '60000'),
    successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD || '3'),
  },
  monitoring: {
    metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
  },
};

// Metrics and monitoring
export class ConsumerMetrics {
  private static instance: ConsumerMetrics;
  private metrics = {
    eventsProcessed: 0,
    eventsFailed: 0,
    eventsRetried: 0,
    averageProcessingTime: 0,
    lastProcessedEvent: null as string | null,
    uptime: Date.now(),
  };

  static getInstance(): ConsumerMetrics {
    if (!ConsumerMetrics.instance) {
      ConsumerMetrics.instance = new ConsumerMetrics();
    }
    return ConsumerMetrics.instance;
  }

  recordEventProcessed(eventName: string, processingTime: number): void {
    this.metrics.eventsProcessed++;
    this.metrics.lastProcessedEvent = eventName;
    this.updateAverageProcessingTime(processingTime);
  }

  recordEventFailed(eventName: string): void {
    this.metrics.eventsFailed++;
  }

  recordEventRetried(): void {
    this.metrics.eventsRetried++;
  }

  private updateAverageProcessingTime(processingTime: number): void {
    const total = this.metrics.averageProcessingTime * (this.metrics.eventsProcessed - 1) + processingTime;
    this.metrics.averageProcessingTime = total / this.metrics.eventsProcessed;
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

// Health check service
class HealthChecker {
  private isHealthy = true;
  private lastHealthCheck = Date.now();

  setHealthy(healthy: boolean): void {
    this.isHealthy = healthy;
    this.lastHealthCheck = Date.now();
  }

  getHealth() {
    return {
      status: this.isHealthy ? 'healthy' : 'unhealthy',
      lastCheck: this.lastHealthCheck,
      uptime: Date.now() - this.lastHealthCheck,
    };
  }
}

// Enhanced error handling with context
export class ConsumerErrorHandler {
  handleError(error: Error, context: { eventName?: string; subscriber?: string; operation?: string }): void {
    log.err(`Consumer error in ${context.subscriber || 'unknown'}: ${JSON.stringify({
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    })}`);

    // Send to monitoring system if available
    this.sendToMonitoring(error, context);
  }

  private sendToMonitoring(error: Error, context: any): void {
    // Implementation would depend on your monitoring system (Prometheus, DataDog, etc.)
    log.info(`Alert: ${error.message} ${JSON.stringify(context)}`);
  }
}

// Graceful shutdown handler
class GracefulShutdown {
  private isShuttingDown = false;
  private shutdownTimeout: NodeJS.Timeout | null = null;

  async shutdown(rabbitConnection?: RabbitMQConnection): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    log.info('Starting graceful shutdown...');

    // Set timeout for forced shutdown
    this.shutdownTimeout = setTimeout(() => {
      log.err('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);

    try {
      // Close database connections
      await AppDataSource.destroy();

      // Close message broker connections
      if (rabbitConnection) {
        await rabbitConnection.close();
      }

      clearTimeout(this.shutdownTimeout);
      log.ok('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      log.err(`Error during shutdown: ${error}`);
      process.exit(1);
    }
  }

  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }
}

// Enhanced connection manager with retry logic
class ConnectionManager {
  private connectionAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;

  async connectWithRetry(): Promise<RabbitMQConnection> {
    while (this.connectionAttempts < this.maxReconnectAttempts) {
      try {
        const connection = new RabbitMQConnection(config.rabbitMQ);
        await connection.connect();
        log.ok('Successfully connected to RabbitMQ');
        return connection;
      } catch (error) {
        this.connectionAttempts++;
        log.err(`Connection attempt ${this.connectionAttempts} failed: ${error}`);

        if (this.connectionAttempts >= this.maxReconnectAttempts) {
          throw new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`);
        }

        const delay = this.reconnectDelay * Math.pow(2, this.connectionAttempts - 1);
        log.info(`Retrying connection in ${delay}ms...`);
        await this.delay(delay);
      }
    }

    throw new Error('Max reconnection attempts exceeded');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main consumer application class
class LogisticsConsumerApp {
  private connectionManager = new ConnectionManager();
  private rabbitConnection!: RabbitMQConnection;
  private eventBus!: RabbitMQEventBus;
  private consumer!: RabbitMQConsumer;
  private circuitBreaker: CircuitBreaker;
  private metrics = ConsumerMetrics.getInstance();
  private healthChecker = new HealthChecker();
  private errorHandler = new ConsumerErrorHandler();
  private shutdownHandler = new GracefulShutdown();

  constructor() {
    this.circuitBreaker = new CircuitBreaker(
      config.circuitBreaker.failureThreshold,
      config.circuitBreaker.recoveryTimeout,
      config.circuitBreaker.successThreshold
    );
  }

  async start(): Promise<void> {
    try {
      // Initialize database
      await this.initializeDatabase();

      // Setup connection with retry logic
      this.rabbitConnection = await this.connectionManager.connectWithRetry();

      // Initialize event bus with circuit breaker
      this.eventBus = new RabbitMQEventBus(this.rabbitConnection, 'logistics-exchange', {
        maxRetries: config.consumer.maxRetries,
        retryDelay: config.consumer.retryDelay,
        deadLetterExchange: 'logistics-dead-letter',
      });

      // Initialize consumer with enhanced options
      this.consumer = new RabbitMQConsumer(this.rabbitConnection, 'logistics-exchange', {
        maxRetries: config.consumer.maxRetries,
        retryDelay: config.consumer.retryDelay,
        batchSize: config.consumer.batchSize,
      });

      // Register event classes for deserialization
      this.registerEventClasses();

      // Create subscribers with error handling
      const subscribers = this.createSubscribers();

      // Start consumer with error handling
      await this.startConsumerWithRetry(subscribers);

      // Setup monitoring and health checks
      this.setupMonitoring();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      log.ok('Logistics consumer started successfully');

    } catch (error) {
      log.err(`Failed to start logistics consumer: ${error}`);
      throw error;
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await AppDataSource.initialize();
      log.ok('Database initialized');
    } catch (error) {
      log.err(`Database initialization failed:', ${error}`);
      throw error;
    }
  }

  private registerEventClasses(): void {
    const registry = EventRegistry.getInstance();
    
    // Import and register all event classes used by this consumer
    // This ensures proper deserialization of events
    log.info('Registering event classes...');
  }

  private createSubscribers() {
    const repository = new TypeOrmPackageRepository(this.eventBus);

    return [
      // Enhanced package creation subscriber
      new EnhancedPackageCreationSubscriber(repository, this.metrics, this.errorHandler),
      
      // Package delivery tracking subscriber
      new PackageDeliveryTracker(repository, this.metrics, this.errorHandler),
      
      // Package status update subscriber
      new PackageStatusUpdater(repository, this.metrics, this.errorHandler),
      
      // Inventory reservation monitoring subscriber
      new InventoryReservationMonitor(repository, this.metrics, this.errorHandler),
      
      // Additional subscribers can be added here
    ];
  }

  private async startConsumerWithRetry(subscribers: any[]): Promise<void> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        await this.consumer.start(subscribers);
        return;
      } catch (error) {
        attempts++;
        log.err(`Consumer start attempt ${attempts} failed: ${error}`);

        if (attempts >= maxAttempts) {
          throw new Error(`Failed to start consumer after ${maxAttempts} attempts`);
        }

        const delay = 5000 * attempts; // Exponential backoff
        log.info(`Retrying consumer start in ${delay}ms...`);
        await this.delay(delay);
      }
    }
  }

  private setupMonitoring(): void {
    // Health check endpoint (if using HTTP server)
    if (config.monitoring.metricsPort) {
      log.info(`Metrics available on port ${config.monitoring.metricsPort}`);
    }

    // Periodic health checks
    setInterval(() => {
      const health = this.healthChecker.getHealth();
      const metrics = this.metrics.getMetrics();
      
      log.info(`Health check: ${JSON.stringify({ health, metrics })}`);

      // Update circuit breaker state in health check
      if (this.circuitBreaker.getState() === 'OPEN') {
        this.healthChecker.setHealthy(false);
      } else {
        this.healthChecker.setHealthy(true);
      }
    }, config.monitoring.healthCheckInterval);
  }

  private setupGracefulShutdown(): void {
    // Handle various shutdown signals
    process.on('SIGTERM', () => this.shutdownHandler.shutdown(this.rabbitConnection));
    process.on('SIGINT', () => this.shutdownHandler.shutdown(this.rabbitConnection));
    process.on('SIGUSR2', () => this.shutdownHandler.shutdown(this.rabbitConnection)); // For nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      log.err(`Uncaught exception: ${error}`);
      this.errorHandler.handleError(error, { operation: 'uncaught_exception' });
      this.shutdownHandler.shutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      log.err(`Unhandled promise rejection: ${reason}`);
      this.errorHandler.handleError(new Error(String(reason)), { operation: 'unhandled_rejection' });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Enhanced subscriber base class
abstract class EnhancedSubscriber {
  constructor(
    protected repository: any,
    protected metrics: ConsumerMetrics,
    protected errorHandler: ConsumerErrorHandler
  ) {}

  abstract subscribedTo(): any[];
  abstract on(event: any): Promise<void>;

  protected async executeWithMetrics<T>(
    eventName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const processingTime = Date.now() - startTime;
      
      this.metrics.recordEventProcessed(eventName, processingTime);
      return result;
    } catch (error) {
      this.metrics.recordEventFailed(eventName);
      throw error;
    }
  }
}

// Enhanced package creation subscriber with advanced error handling
class EnhancedPackageCreationSubscriber extends EnhancedSubscriber {
  subscribedTo() {
    return [CreatePackageOnStockReserved];
  }

  async on(event: any): Promise<void> {
    await this.executeWithMetrics('stock_item.reserved', async () => {
      try {
        const pkg = Package.register(
          PackageId.random(),
          TrackingNumber.generate(),
          event.reservationIdentifier
        );

        await this.repository.save(pkg);

        log.info(`Package created for reservation: ${event.reservationIdentifier}`);
        
        // Additional business logic could be added here
        // e.g., send notifications, update external systems, etc.
        
      } catch (error) {
        this.errorHandler.handleError(error as Error, {
          subscriber: 'EnhancedPackageCreationSubscriber',
          eventName: 'stock_item.reserved',
        });
        throw error;
      }
    });
  }
}

// Main execution
async function startLogisticsConsumer() {
  const app = new LogisticsConsumerApp();
  await app.start();
}

// Start the consumer
startLogisticsConsumer().catch((error) => {
  log.err(`Failed to start logistics consumer: ${error}`);
  process.exit(1);
});
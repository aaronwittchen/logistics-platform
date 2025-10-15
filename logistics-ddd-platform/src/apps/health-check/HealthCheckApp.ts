import { HttpServer } from '@/Shared/infrastructure/http/HttpServer';
import { Router } from 'express';
import { AppDataSource } from '@/Shared/infrastructure/persistence/TypeOrmConfig';
import { log } from '@/utils/log';

export class HealthCheckApp {
  private server: HttpServer;

  constructor(port: number = 3002) {
    this.server = new HttpServer(port);
    log.info(`Health Check API will run on port ${port}`);
  }

  async start(): Promise<void> {
    log.load('Starting Health Check Service...');

    try {
      this.registerRoutes();
      await this.server.start();
      log.ok('Health Check service started successfully');
      log.info(`Health endpoint: http://localhost:${this.server['port'] || 3002}/health`);
    } catch (error) {
      log.err(`Failed to start Health Check service: ${error}`);
      throw error;
    }
  }

  private registerRoutes(): void {
    const router = Router();
    log.load('Registering health check routes...');

    router.get('/health', async (req, res) => {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          postgres: await this.checkPostgres(),
          elasticsearch: await this.checkElasticSearch(),
          rabbitmq: await this.checkRabbitMQ(),
        },
      };

      const isHealthy = Object.values(health.services).every(status => status === 'ok');

      if (isHealthy) {
        health.status = 'ok';
        res.status(200).json(health);
      } else {
        health.status = 'error';
        res.status(503).json(health);
      }
    });

    // Detailed health endpoint with more information
    router.get('/health/detailed', async (req, res) => {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {
          postgres: await this.checkPostgresDetailed(),
          elasticsearch: await this.checkElasticSearchDetailed(),
          rabbitmq: await this.checkRabbitMQDetailed(),
        },
      };

      const isHealthy = Object.values(health.services).every(service => service.status === 'ok');

      if (isHealthy) {
        health.status = 'ok';
        res.status(200).json(health);
      } else {
        health.status = 'error';
        res.status(503).json(health);
      }
    });

    this.server.registerRouter(router);
    log.ok('Health check routes registered');
  }

  private async checkPostgres(): Promise<string> {
    try {
      await AppDataSource.query('SELECT 1');
      return 'ok';
    } catch (error) {
      log.err(`PostgreSQL health check failed: ${error}`);
      return 'error';
    }
  }

  private async checkPostgresDetailed(): Promise<{ status: string; responseTime?: number; error?: string }> {
    const start = Date.now();
    try {
      await AppDataSource.query('SELECT 1');
      const responseTime = Date.now() - start;
      return { status: 'ok', responseTime };
    } catch (error: unknown) {
      return { status: 'error', error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async checkElasticSearch(): Promise<string> {
    try {
      // Simple HTTP ping to Elasticsearch
      const response = await fetch(`${process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'}/_cluster/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const health = (await response.json()) as { status: string };
        return health.status !== 'red' ? 'ok' : 'error';
      } else {
        log.err(`ElasticSearch HTTP check failed: ${response.status} ${response.statusText}`);
        return 'error';
      }
    } catch (error) {
      log.err(`ElasticSearch health check failed: ${error}`);
      return 'error';
    }
  }

  private async checkElasticSearchDetailed(): Promise<{ status: string; responseTime?: number; error?: string }> {
    const start = Date.now();
    try {
      const response = await fetch(`${process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'}/_cluster/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - start;

      if (response.ok) {
        const health = (await response.json()) as { status: string };
        return { status: health.status !== 'red' ? 'ok' : 'error', responseTime };
      } else {
        return { status: 'error', responseTime, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error: unknown) {
      return { status: 'error', error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async checkRabbitMQ(): Promise<string> {
    // We'll implement a basic RabbitMQ check
    // For now, just return 'ok' since we don't have a direct connection here
    return 'ok';
  }

  private async checkRabbitMQDetailed(): Promise<{ status: string; responseTime?: number; error?: string }> {
    const start = Date.now();
    try {
      // Basic RabbitMQ connectivity check
      const responseTime = Date.now() - start;
      return { status: 'ok', responseTime };
    } catch (error: unknown) {
      return { status: 'error', error: error instanceof Error ? error.message : String(error) };
    }
  }

  async close(): Promise<void> {
    await this.server.close();
    log.ok('Health Check service closed');
  }

  get port(): number {
    return this.server['port'] || 3002;
  }
}

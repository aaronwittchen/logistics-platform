import 'reflect-metadata';
import { HttpServer } from '@/Shared/infrastructure/http/HttpServer';
import { ElasticSearchClient } from '@/Shared/infrastructure/persistence/ElasticSearchClient';
import { ElasticSearchTrackingProjectionRepository } from '@/Contexts/Backoffice/TrackingProjection/infrastructure/ElasticSearchTrackingProjectionRepository';
import { FindTrackingQueryHandler } from '@/Contexts/Backoffice/TrackingProjection/application/Find/FindTrackingQueryHandler';
import { GetTrackingGetController } from '@/Contexts/Backoffice/TrackingProjection/infrastructure/controllers/GetTrackingGetController';
import { RebuildProjectionsCommandHandler } from '@/Contexts/Backoffice/TrackingProjection/application/RebuildProjections/RebuildProjectionsCommandHandler';
import { RebuildProjectionsPostController } from '@/Contexts/Backoffice/TrackingProjection/infrastructure/controllers/RebuildProjectionsPostController';
import { TypeOrmStockItemRepository } from '@/Contexts/Inventory/StockItem/infrastructure/persistence/TypeOrmStockItemRepository';
import { TypeOrmPackageRepository } from '@/Contexts/Logistics/Package/infrastructure/persistence/TypeOrmPackageRepository';
import { Router } from 'express';
import { log } from '@/utils/log';

export class BackofficeBackendApp {
  private server: HttpServer;

  constructor(port: number = 3001) {
    this.server = new HttpServer(port);
    log.info(`Backoffice API will run on port ${port}`);
  }

  async start(): Promise<void> {
    log.load('Starting Backoffice Backend...');

    try {
      await this.initializeInfrastructure();
      this.registerRoutes();
      await this.server.start();
      log.ok('Backoffice backend started successfully');
      log.info(`API Documentation: http://localhost:${this.server['port'] || 3001}/api-docs`);
    } catch (error) {
      log.err(`Failed to start Backoffice backend: ${error}`);
      throw error;
    }
  }

  private async initializeInfrastructure(): Promise<void> {
    log.load('Checking infrastructure health...');

    // Check ElasticSearch connection
    try {
      const esClient = new ElasticSearchClient();
      const isHealthy = await esClient.healthCheck();

      if (isHealthy) {
        log.ok('ElasticSearch connected and healthy');
      } else {
        log.warn('ElasticSearch health check failed - projections may not work');
        log.info('Start ElasticSearch with: docker-compose up -d elasticsearch');
      }
    } catch (error) {
      log.warn(`ElasticSearch connection failed: ${error instanceof Error ? error.message : String(error)}`);
      log.info('Projections will not be available until ElasticSearch is running');
    }
  }

  private registerRoutes(): void {
    const router = Router();
    log.load('Registering Backoffice routes...');

    // Check if ElasticSearch is available for CQRS read infrastructure
    const esClient = new ElasticSearchClient();
    esClient
      .healthCheck()
      .then(isHealthy => {
        if (isHealthy) {
          log.ok('ElasticSearch available - registering tracking routes');

          const repository = new ElasticSearchTrackingProjectionRepository(esClient);
          const queryHandler = new FindTrackingQueryHandler(repository);
          const controller = new GetTrackingGetController(queryHandler);

          // Tracking query endpoints
          router.get('/tracking/:id', (req, res) => controller.run(req, res));

          // Add rebuild projections endpoint
          const stockItemRepo = new TypeOrmStockItemRepository();
          const packageRepo = new TypeOrmPackageRepository();
          const rebuildHandler = new RebuildProjectionsCommandHandler(
            stockItemRepo,
            packageRepo,
            repository, // This is the tracking repository already created above
          );
          const rebuildController = new RebuildProjectionsPostController(rebuildHandler);
          router.post('/projections/rebuild', (req, res) => rebuildController.run(req, res));

          log.ok('Tracking routes registered');
        } else {
          log.warn('ElasticSearch not available - tracking routes disabled');
          log.info('Start ElasticSearch to enable projection queries');

          // Register fallback route for when ElasticSearch is not available
          router.get('/tracking/:id', (req, res) => {
            res.status(503).json({
              error: 'Tracking service unavailable',
              message: 'ElasticSearch is not running. Start it with: docker-compose up -d elasticsearch',
            });
          });
        }
      })
      .catch(error => {
        log.err(`Failed to check ElasticSearch health: ${error}`);
        // Register error route as fallback
        router.get('/tracking/:id', (req, res) => {
          res.status(503).json({
            error: 'Tracking service unavailable',
            message: 'Unable to connect to ElasticSearch',
          });
        });
      });

    this.server.registerRouter(router);
    log.ok('Backoffice routes registered');
  }

  async close(): Promise<void> {
    await this.server.close();
    log.ok('Backoffice backend closed');
  }

  get port(): number {
    return this.server['port'] || 3001;
  }
}

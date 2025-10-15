#!/usr/bin/env tsx

/**
 * Simple script to test projection rebuilding functionality
 */

import 'reflect-metadata';
import { AppDataSource } from '../logistics-ddd-platform/src/Shared/infrastructure/persistence/TypeOrmConfig';
import { TypeOrmStockItemRepository } from '../logistics-ddd-platform/src/Contexts/Inventory/StockItem/infrastructure/persistence/TypeOrmStockItemRepository';
import { TypeOrmPackageRepository } from '../logistics-ddd-platform/src/Contexts/Logistics/Package/infrastructure/persistence/TypeOrmPackageRepository';
import { ElasticSearchClient } from '../logistics-ddd-platform/src/Shared/infrastructure/persistence/ElasticSearchClient';
import { ElasticSearchTrackingProjectionRepository } from '../logistics-ddd-platform/src/Contexts/Backoffice/TrackingProjection/infrastructure/ElasticSearchTrackingProjectionRepository';
import { RebuildProjectionsCommandHandler } from '../logistics-ddd-platform/src/Contexts/Backoffice/TrackingProjection/application/RebuildProjections/RebuildProjectionsCommandHandler';
import { RebuildProjectionsCommand } from '../logistics-ddd-platform/src/Contexts/Backoffice/TrackingProjection/application/RebuildProjections/RebuildProjectionsCommand';
import { log } from '../logistics-ddd-platform/src/utils/log';

async function rebuildProjections() {
  try {
    log.info('Initializing database connection...');
    await AppDataSource.initialize();

    log.info('Setting up repositories...');
    const stockItemRepo = new TypeOrmStockItemRepository();
    const packageRepo = new TypeOrmPackageRepository();
    const trackingRepo = new ElasticSearchTrackingProjectionRepository(new ElasticSearchClient());

    log.info('Creating command handler...');
    const handler = new RebuildProjectionsCommandHandler(stockItemRepo, packageRepo, trackingRepo);

    log.info('Executing rebuild command...');
    const command = new RebuildProjectionsCommand();
    await handler.execute(command);

    log.ok('Projection rebuild completed successfully!');

    // Show some stats
    const count = await trackingRepo.count();
    log.info(`Total projections created: ${count}`);

  } catch (error) {
    log.err(`Failed to rebuild projections: ${error}`);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the script
rebuildProjections().catch(error => {
  log.err(`Script failed: ${error}`);
  process.exit(1);
});
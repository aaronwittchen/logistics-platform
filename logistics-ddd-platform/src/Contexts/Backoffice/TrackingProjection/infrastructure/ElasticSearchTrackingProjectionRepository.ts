import { ElasticSearchClient } from '@/Shared/infrastructure/persistence/ElasticSearchClient';
import { TrackingView } from '../domain/TrackingView';
import { TrackingProjectionRepository } from '../domain/TrackingProjectionRepository';
import { log } from '@/utils/log';

export class ElasticSearchTrackingProjectionRepository implements TrackingProjectionRepository {
  private readonly indexName = 'tracking_projections';

  constructor(private readonly client: ElasticSearchClient) {
    this.initializeIndex();
  }

  private async initializeIndex(): Promise<void> {
    await this.client.createIndex(this.indexName, {
      properties: {
        id: { type: 'keyword' },
        stockItemId: { type: 'keyword' },
        stockItemName: { type: 'text' },
        reservedQuantity: { type: 'integer' },
        reservationId: { type: 'keyword' },
        status: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    });
    log.ok(`Initialized tracking projections index: ${this.indexName}`);
  }

  async save(tracking: TrackingView): Promise<void> {
    await this.client.index(this.indexName, tracking.id, {
      ...tracking,
      createdAt: tracking.createdAt.toISOString(),
      updatedAt: tracking.updatedAt.toISOString(),
    });
    log.ok(`Saved tracking projection: ${tracking.id}`);
  }

  async find(id: string): Promise<TrackingView | null> {
    try {
      const result = await this.client.get(this.indexName, id);
      if (result) {
        const trackingData = result as unknown as TrackingView;
        return {
          id: trackingData.id,
          stockItemId: trackingData.stockItemId,
          stockItemName: trackingData.stockItemName,
          reservedQuantity: trackingData.reservedQuantity,
          reservationId: trackingData.reservationId,
          status: trackingData.status,
          createdAt: new Date(trackingData.createdAt),
          updatedAt: new Date(trackingData.updatedAt),
        };
      }
      return null;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'meta' in error &&
        typeof error.meta === 'object' &&
        error.meta !== null &&
        'statusCode' in error.meta &&
        typeof error.meta.statusCode === 'number' &&
        error.meta.statusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  async findByStockItemId(stockItemId: string): Promise<TrackingView[]> {
    const results = await this.client.search(this.indexName, {
      match: { stockItemId },
    });

    return results.map(result => ({
      id: result.id as string,
      stockItemId: result.stockItemId as string,
      stockItemName: result.stockItemName as string,
      reservedQuantity: result.reservedQuantity as number,
      reservationId: result.reservationId as string,
      status: result.status as TrackingView['status'],
      createdAt: new Date(result.createdAt as string),
      updatedAt: new Date(result.updatedAt as string),
    }));
  }

  async update(id: string, data: Partial<TrackingView>): Promise<void> {
    await this.client.update(this.indexName, id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    log.ok(`Updated tracking projection: ${id}`);
  }

  async delete(id: string): Promise<void> {
    try {
      await this.client.delete(this.indexName, id);
      log.ok(`Deleted tracking projection: ${id}`);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'meta' in error &&
        typeof error.meta === 'object' &&
        error.meta !== null &&
        'statusCode' in error.meta &&
        typeof error.meta.statusCode === 'number' &&
        error.meta.statusCode === 404
      ) {
        log.warn(`Tracking projection not found for deletion: ${id}`);
        return;
      }
      throw error;
    }
  }

  async findByStatus(status: TrackingView['status']): Promise<TrackingView[]> {
    const results = await this.client.search(this.indexName, {
      match: { status },
    });

    return results.map(result => ({
      id: result.id as string,
      stockItemId: result.stockItemId as string,
      stockItemName: result.stockItemName as string,
      reservedQuantity: result.reservedQuantity as number,
      reservationId: result.reservationId as string,
      status: result.status as TrackingView['status'],
      createdAt: new Date(result.createdAt as string),
      updatedAt: new Date(result.updatedAt as string),
    }));
  }

  async findByReservationId(reservationId: string): Promise<TrackingView | null> {
    const results = await this.client.search(this.indexName, {
      match: { reservationId },
    });

    if (results.length > 0) {
      const result = results[0];
      return {
        id: result.id as string,
        stockItemId: result.stockItemId as string,
        stockItemName: result.stockItemName as string,
        reservedQuantity: result.reservedQuantity as number,
        reservationId: result.reservationId as string,
        status: result.status as TrackingView['status'],
        createdAt: new Date(result.createdAt as string),
        updatedAt: new Date(result.updatedAt as string),
      };
    }
    return null;
  }

  async findAll(): Promise<TrackingView[]> {
    const results = await this.client.search(this.indexName, {
      match_all: {},
    });

    return results.map(result => ({
      id: result.id as string,
      stockItemId: result.stockItemId as string,
      stockItemName: result.stockItemName as string,
      reservedQuantity: result.reservedQuantity as number,
      reservationId: result.reservationId as string,
      status: result.status as TrackingView['status'],
      createdAt: new Date(result.createdAt as string),
      updatedAt: new Date(result.updatedAt as string),
    }));
  }

  async count(): Promise<number> {
    const result = await this.client.getClient().count({
      index: this.indexName,
    });
    return result.count;
  }

  async clearAll(): Promise<void> {
    try {
      await this.client.getClient().deleteByQuery({
        index: this.indexName,
        query: { match_all: {} },
      });
      log.ok('Cleared all tracking projections');
    } catch {
      // Index might not exist yet
      log.info('No projections to clear or index does not exist');
    }
  }
}

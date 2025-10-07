import { ElasticSearchClient } from '@/Shared/infrastructure/persistence/ElasticSearchClient';
import { TrackingView } from '../domain/TrackingView';
import { TrackingProjectionRepository } from '../domain/TrackingProjectionRepository';
import { log } from '@/utils/log';

export class ElasticSearchTrackingProjectionRepository
  implements TrackingProjectionRepository
{
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
        return {
          ...result,
          createdAt: new Date(result.createdAt),
          updatedAt: new Date(result.updatedAt),
        };
      }
      return null;
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
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
      ...result,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
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
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
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
      ...result,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
    }));
  }

  async findByReservationId(reservationId: string): Promise<TrackingView | null> {
    const results = await this.client.search(this.indexName, {
      match: { reservationId },
    });

    if (results.length > 0) {
      const result = results[0];
      return {
        ...result,
        createdAt: new Date(result.createdAt),
        updatedAt: new Date(result.updatedAt),
      };
    }
    return null;
  }

  async findAll(): Promise<TrackingView[]> {
    const results = await this.client.search(this.indexName, {
      match_all: {},
    });

    return results.map(result => ({
      ...result,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
    }));
  }

  async count(): Promise<number> {
    const result = await this.client.getClient().count({
      index: this.indexName,
    });
    return result.count;
  }
}
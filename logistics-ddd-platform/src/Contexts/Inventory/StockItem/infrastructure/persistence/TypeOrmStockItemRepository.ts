import { DataSource, Repository } from 'typeorm';
import { StockItem } from '@/Contexts/Inventory/StockItem/domain/StockItem';
import { StockItemId } from '@/Contexts/Inventory/StockItem/domain/StockItemId';
import { StockItemName } from '@/Contexts/Inventory/StockItem/domain/StockItemName';
import { Quantity } from '@/Contexts/Inventory/StockItem/domain/Quantity';
import { StockItemRepository } from '@/Contexts/Inventory/StockItem/domain/StockItemRepository';
import { StockItemEntity } from './StockItemEntity';
import { EventBus } from '@/Shared/domain/EventBus';
import { AppDataSource } from '@/Shared/infrastructure/persistence/TypeOrmConfig';
import { log } from '@/utils/log';

export class TypeOrmStockItemRepository implements StockItemRepository {
  private repository: Repository<StockItemEntity>;

  constructor(
    private readonly eventBus?: EventBus,
    dataSource?: DataSource,
  ) {
    // Use the provided DataSource for testing, otherwise use AppDataSource
    const ds = dataSource || AppDataSource;
    this.repository = ds.getRepository(StockItemEntity);
  }

  async save(stockItem: StockItem): Promise<void> {
    const primitives = stockItem.toPrimitives();
    const entity = this.repository.create(primitives);

    await this.repository.save(entity);

    // Publish domain events
    if (this.eventBus) {
      try {
        const events = stockItem.pullDomainEvents();
        await this.eventBus.publish(events);
      } catch (error) {
        // Log the error but don't fail the save operation
        log.err(`Failed to publish domain events: ${error}`);
      }
    }
  }

  async find(id: StockItemId): Promise<StockItem | null> {
    const searchId = id.value; // Use .value instead of .toString()
    log.info(`Searching for stock item with ID: ${searchId}`);

    const entity = await this.repository.findOne({
      where: { id: searchId },
    });

    log.info(`Database query result: ${entity}`);

    if (!entity) {
      log.warn('Stock item not found in database');
      return null;
    }

    log.ok(`Stock item found: ${entity.id} - ${entity.name} (Qty: ${entity.quantity})`);
    return StockItem.add({
      id: new StockItemId(entity.id),
      name: new StockItemName(entity.name),
      quantity: new Quantity(entity.quantity),
    });
  }

  async delete(id: StockItemId): Promise<void> {
    const existingEntity = await this.repository.findOne({
      where: { id: id.value },
    });

    if (existingEntity) {
      await this.repository.delete(id.value);
    }
    // If entity doesn't exist, do nothing (graceful handling)
  }

  async findAll(): Promise<StockItem[]> {
    const entities = await this.repository.find();

    return entities.map(entity =>
      StockItem.add({
        id: new StockItemId(entity.id),
        name: new StockItemName(entity.name),
        quantity: new Quantity(entity.quantity),
      }),
    );
  }
}

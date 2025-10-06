import { DataSource, Repository } from 'typeorm';
import { StockItem } from '../../domain/StockItem';
import { StockItemId } from '../../domain/StockItemId';
import { StockItemName } from '../../domain/StockItemName';
import { Quantity } from '../../domain/Quantity';
import { StockItemRepository } from '../../domain/StockItemRepository';
import { StockItemEntity } from './StockItemEntity';
import { EventBus } from '@/Shared/domain/EventBus';
import { AppDataSource } from '@/Shared/infrastructure/persistence/TypeOrmConfig';

export class TypeOrmStockItemRepository implements StockItemRepository {
  private repository: Repository<StockItemEntity>;

  constructor(private readonly eventBus?: EventBus) {
    this.repository = AppDataSource.getRepository(StockItemEntity);
  }

  async save(stockItem: StockItem): Promise<void> {
    const primitives = stockItem.toPrimitives();
    const entity = this.repository.create(primitives);

    await this.repository.save(entity);

    // Publish domain events
    if (this.eventBus) {
      const events = stockItem.pullDomainEvents();
      await this.eventBus.publish(events);
    }
  }

  async find(id: StockItemId): Promise<StockItem | null> {
    const entity = await this.repository.findOne({
      where: { id: id.toString() },
    });

    if (!entity) {
      return null;
    }

    return StockItem.add({
      id: new StockItemId(entity.id),
      name: new StockItemName(entity.name),
      quantity: new Quantity(entity.quantity)
    });
  }

  async delete(id: StockItemId): Promise<void> {
    await this.repository.delete(id.toString());
  }
}

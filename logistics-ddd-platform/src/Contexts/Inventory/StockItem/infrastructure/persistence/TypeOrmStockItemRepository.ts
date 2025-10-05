import { Repository, DataSource } from "typeorm";
import type { StockItemRepository } from "../../domain/StockItemRepository";
import { StockItem } from "../../domain/StockItem";
import { StockItemId } from "../../domain/StockItemId";
import { StockItemEntity } from "./StockItemEntity";

/**
 * TypeORM implementation of the StockItemRepository.
 *
 * Responsibilities:
 * - Persist StockItem aggregates to the database
 * - Retrieve StockItem aggregates from the database
 * - Delete StockItem aggregates
 * - Convert between domain aggregates and TypeORM entities
 */
export class TypeOrmStockItemRepository implements StockItemRepository {
  constructor(private readonly repo: Repository<StockItemEntity>) {}

  /**
   * Factory method to create the repository from a TypeORM DataSource.
   *
   * @param dataSource - TypeORM DataSource instance
   * @returns a new TypeOrmStockItemRepository
   */
  static fromDataSource(dataSource: DataSource): TypeOrmStockItemRepository {
    return new TypeOrmStockItemRepository(dataSource.getRepository(StockItemEntity));
  }

  /**
   * Saves a StockItem aggregate to the database.
   *
   * @param stockItem - the StockItem aggregate to persist
   */
  async save(stockItem: StockItem): Promise<void> {
    const entity = StockItemEntity.fromDomain(stockItem);
    await this.repo.save(entity);
  }

  /**
   * Finds a StockItem by its ID.
   *
   * @param id - the StockItemId to search for
   * @returns the StockItem aggregate or null if not found
   */
  async find(id: StockItemId): Promise<StockItem | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    if (!entity) return null;

    const domain = entity.toDomain();
    // Clear any domain events emitted during rehydration from the DB
    domain.pullDomainEvents();
    return domain;
  }

  /**
   * Deletes a StockItem from the database.
   *
   * @param id - the StockItemId of the aggregate to delete
   */
  async delete(id: StockItemId): Promise<void> {
    await this.repo.delete({ id: id.value });
  }
}

import { StockItem } from "./StockItem";
import { StockItemId } from "./StockItemId";

/**
 * StockItemRepository
 *
 * Defines the contract for a repository that manages StockItem aggregates.
 *
 * Responsibilities:
 * - Abstracts data persistence and retrieval
 * - Provides a consistent interface for working with StockItem aggregates
 * - Keeps domain logic separate from infrastructure details (like databases)
 */
export interface StockItemRepository {
  /**
   * Save a StockItem aggregate.
   * Can be used for both creating new items or updating existing ones.
   * 
   * @param stockItem - the StockItem aggregate to persist
   */
  save(stockItem: StockItem): Promise<void>;

  /**
   * Find a StockItem by its unique identifier.
   * 
   * @param id - the StockItemId of the aggregate
   * @returns the StockItem aggregate if found, or null if not
   */
  find(id: StockItemId): Promise<StockItem | null>;

  /**
   * Find all StockItem aggregates.
   * 
   * @returns array of all StockItem aggregates
   */
  findAll(): Promise<StockItem[]>;

  /**
   * Delete a StockItem aggregate by its ID.
   * 
   * @param id - the StockItemId of the aggregate to delete
   */
  delete(id: StockItemId): Promise<void>;
}
import { Uuid } from "@/Shared/domain/Uuid";

/**
 * StockItemId
 *
 * A specialized ValueObject representing the unique identifier for a Stock Item aggregate.
 *
 * Extends the generic Uuid ValueObject to enforce **type safety**.
 * Using a specific class instead of plain Uuid prevents accidental misuse of IDs
 * across different aggregates.
 */
export class StockItemId extends Uuid {
  /**
   * Create a StockItemId from an existing UUID string.
   *
   * @param value - a valid UUID string
   * @returns a new StockItemId instance
   */
  static from(value: string): StockItemId {
    return new StockItemId(value);
  }

  /**
   * Generate a new random StockItemId.
   *
   * @returns a new StockItemId with a randomly generated UUID
   */
  static random(): StockItemId {
    return new StockItemId(Uuid.random().value);
  }
}

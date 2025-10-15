import { ValueObject } from '@/Shared/domain/ValueObject';

/**
 * Interface representing the properties of StockItemName.
 */
interface StockItemNameProps {
  value: string; // the actual name of the stock item
}

/**
 * StockItemName
 *
 * A ValueObject representing the name of a Stock Item in the domain.
 *
 * Responsibilities:
 * - Enforce validation rules for stock item names
 * - Ensure immutability
 * - Provide type-safe access to the name value
 */
export class StockItemName extends ValueObject<StockItemNameProps> {
  /** Minimum allowed length for a stock item name */
  private static readonly MIN_LENGTH = 1;

  /** Maximum allowed length for a stock item name */
  private static readonly MAX_LENGTH = 100;

  /**
   * Constructor
   *
   * @param value - the stock item name
   */
  constructor(value: string) {
    super({ value }); // passes the value to the base ValueObject
  }

  /**
   * Validation hook
   *
   * Ensures the stock item name is not empty and within allowed length.
   * Throws an Error if validation fails.
   *
   * @param value - the stock item name to validate
   */
  protected validate({ value }: StockItemNameProps): void {
    const trimmed = value?.trim();
    if (!trimmed) throw new Error('StockItemName cannot be empty');
    if (trimmed.length < StockItemName.MIN_LENGTH) throw new Error('StockItemName too short');
    if (trimmed.length > StockItemName.MAX_LENGTH) throw new Error('StockItemName too long');
  }

  /** Getter for the name value */
  get value(): string {
    return this.unwrap().value;
  }

  /**
   * Factory method to create a StockItemName
   *
   * @param value - the stock item name
   * @returns a new StockItemName instance
   */
  static from(value: string): StockItemName {
    return new StockItemName(value);
  }
}

import { ValueObject } from '@/Shared/domain/ValueObject';

/**
 * Interface representing the properties of Quantity.
 */
interface QuantityProps {
  value: number; // the numeric quantity value
}

/**
 * Quantity
 *
 * A ValueObject representing a quantity in the domain.
 *
 * Responsibilities:
 * - Enforce domain rules for quantity values
 * - Ensure immutability
 * - Provide type-safe access to the quantity
 */
export class Quantity extends ValueObject<QuantityProps> {
  /** Minimum allowed quantity */
  private static readonly MIN = 0;

  /** Maximum allowed quantity to prevent unrealistic values or mistakes */
  private static readonly MAX = 1_000_000_000;

  /**
   * Constructor
   *
   * @param value - the numeric quantity
   */
  constructor(value: number) {
    super({ value }); // pass value to base ValueObject
  }

  /**
   * Validation hook
   *
   * Ensures the quantity is a finite integer within allowed bounds.
   * Throws an Error if validation fails.
   *
   * @param value - the quantity value to validate
   */
  protected validate({ value }: QuantityProps): void {
    if (!Number.isFinite(value)) throw new Error('Quantity must be a finite number');
    if (!Number.isInteger(value)) throw new Error('Quantity must be an integer');
    if (value < Quantity.MIN) throw new Error('Quantity cannot be negative');
    if (value > Quantity.MAX) throw new Error('Quantity too large');
  }

  /** Getter for the numeric quantity */
  get value(): number {
    return this.unwrap().value;
  }

  /**
   * Check if this quantity is greater than or equal to another quantity
   *
   * @param other - the quantity to compare against
   * @returns true if this quantity >= other quantity
   */
  isGreaterThanOrEqual(other: Quantity): boolean {
    return this.value >= other.value;
  }

  /**
   * Subtract another quantity from this quantity
   *
   * @param other - the quantity to subtract
   * @returns a new Quantity with the result
   */
  subtract(other: Quantity): Quantity {
    return Quantity.from(this.value - other.value);
  }

  /**
   * Alias for value getter for compatibility
   *
   * @returns the numeric quantity value
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Factory method to create a Quantity instance
   *
   * @param value - the numeric quantity
   * @returns a new Quantity instance
   */
  static from(value: number): Quantity {
    return new Quantity(value);
  }
}

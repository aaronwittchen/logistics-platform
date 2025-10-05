import { ValueObject } from "@/Shared/domain/ValueObject";

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
    if (!Number.isFinite(value)) throw new Error("Quantity must be a finite number");
    if (!Number.isInteger(value)) throw new Error("Quantity must be an integer");
    if (value < Quantity.MIN) throw new Error("Quantity cannot be negative");
    if (value > Quantity.MAX) throw new Error("Quantity too large");
  }

  /** Getter for the numeric quantity */
  get value(): number {
    return this.unwrap().value;
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

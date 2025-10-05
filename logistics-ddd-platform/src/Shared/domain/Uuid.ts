// Import the UUID generator and the base ValueObject class
import { v4 as uuid } from 'uuid';
import { ValueObject } from './ValueObject';

/**
 * Uuid Value Object
 *
 * Represents a unique identifier within the domain.
 * - Ensures immutability and validity through ValueObject.
 * - Validates that the string is a proper UUID v4 format.
 */

interface UuidProps {
  value: string;
}

export class Uuid extends ValueObject<UuidProps> {
  /**
   * Creates a new Uuid instance from an existing string value.
   * Throws an error if the string is not a valid UUID.
   */
  constructor(value: string) {
    super({ value });
  }

  /**
   * Generates a new random UUID v4 wrapped in a ValueObject.
   * Example:
   *   const id = Uuid.random();
   */
  static random(): Uuid {
    return new Uuid(uuid());
  }

  /**
   * Validates the provided string to ensure it follows UUID v4 format.
   * Throws an error if invalid.
   */
  protected validate(props: UuidProps): void {
    const id = props.value;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      throw new Error(`Invalid UUID: ${id}`);
    }
  }

  get value(): string {
    return this.unwrap().value;
  }

  static from(value: string): Uuid {
    return new Uuid(value);
  }
}

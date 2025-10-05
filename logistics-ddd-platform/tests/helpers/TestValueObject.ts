// Import the base ValueObject class from your shared domain
import { ValueObject } from "../../src/Shared/domain/ValueObject";

/**
 * TestValueObject
 *
 * A helper subclass of ValueObject used **only for testing purposes**.
 * 
 * Why it exists:
 * - ValueObject's constructor is `protected`, so it cannot be instantiated directly.
 * - In tests, we often need a concrete ValueObject to verify:
 *   - deep equality
 *   - immutability
 *   - serialization
 *   - other ValueObject behaviors
 *
 * This class allows creating arbitrary ValueObjects with any props.
 *
 * @template T - the shape of the properties object
 */
export class TestValueObject<T extends object> extends ValueObject<T> {
  /**
   * Constructor exposes the protected base constructor for tests.
   *
   * @param props - the properties of the ValueObject
   */
  constructor(props: T) {
    super(props);
  }
}

// Define all primitive JavaScript types
export type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/**
 * Checks if a value is a plain (non-null, non-array) object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Performs a deep equality check between two values.
 * Supports primitives, arrays, objects, and Date instances.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  // If both values are strictly equal (including NaN), return true
  if (Object.is(a, b)) return true;

  // Handle Date comparison by comparing timestamps
  const aIsDate = a instanceof Date;
  const bIsDate = b instanceof Date;
  if (aIsDate || bIsDate) {
    return aIsDate && bIsDate && (a as Date).getTime() === (b as Date).getTime();
  }

  // Compare arrays recursively
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Compare objects recursively
  if (isObject(a) && isObject(b)) {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();

    // Ensure both objects have the same keys
    if (aKeys.length !== bKeys.length) return false;
    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i]) return false;
    }

    // Compare each property recursively
    for (const key of aKeys) {
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  // Otherwise, not equal
  return false;
}

/**
 * Recursively freezes an object or array, making it deeply immutable.
 */
function deepFreeze<T>(value: T): T {
  if (isObject(value) || Array.isArray(value)) {
    // First, recursively freeze children without reassigning onto the parent
    const iterate = Array.isArray(value)
      ? (value as unknown[]).forEach.bind(value)
      : (Object.values(value as Record<string, unknown>) as unknown[]).forEach.bind(
          Object.values(value as Record<string, unknown>)
        );

        iterate((child: unknown) => {
          if (child && (typeof child === "object" || typeof child === "function") && !Object.isFrozen(child)) {
            deepFreeze(child);
          }
        });

    // Then freeze the parent itself
    Object.freeze(value);
  }
  return value;
}

/**
 * Base class for implementing Domain-Driven Design (DDD) Value Objects.
 * - Ensures immutability (via deepFreeze)
 * - Compares by value (via deepEqual)
 * - Supports validation via `validate()`
 */
export abstract class ValueObject<TProps extends object> {
  // The immutable, read-only properties of the value object
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    // Allow subclasses to validate invariants
    this.validate(props);

    // Make the properties deeply immutable
    this.props = deepFreeze({ ...(props as Record<string, unknown>) }) as Readonly<TProps>;
  }

  /**
   * Optional validation hook for enforcing domain invariants.
   * Override in subclasses to throw errors for invalid props.
   */
  protected validate(_props: TProps): void {}

  /**
   * Compares two value objects for deep equality.
   * They are equal if their props are equal and of the same class.
   */
  public equals(other?: ValueObject<TProps>): boolean {
    if (other === undefined || other === null) return false;
    if (this === other) return true;
    if (this.constructor !== other.constructor) return false;
    return deepEqual(this.props, other.props);
  }

  /**
   * Returns a plain JSON representation of the value object.
   */
  public toJSON(): unknown {
    return this.unwrap();
  }

  /**
   * Returns a stringified JSON representation of the value object.
   */
  public toString(): string {
    return JSON.stringify(this.unwrap());
  }

  /**
   * Returns the internal (immutable) props.
   */
  public unwrap(): Readonly<TProps> {
    return this.props;
  }
}

/**
 * Type guard to check whether a given value is a ValueObject instance.
 */
export function isValueObject(value: unknown): value is ValueObject<object> {
  return Boolean(value) && value instanceof ValueObject;
}

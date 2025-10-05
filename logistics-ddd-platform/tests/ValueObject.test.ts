import { describe, expect, test } from "bun:test";
import { ValueObject, isValueObject } from "../src/Shared/domain/ValueObject";
import { TestValueObject } from "./helpers/TestValueObject";

// ==============================
// Sample ValueObjects for testing
// ==============================

// Email ValueObject with validation
class Email extends ValueObject<{ value: string }> {
  constructor(props: { value: string }) {
    super(props);
  }

  // Enforce email format validation
  protected validate({ value }: { value: string }): void {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      throw new Error("Invalid email");
    }
  }

  // Getter for easy access
  get value(): string {
    return this.unwrap().value;
  }
}

// Point ValueObject with x/y coordinates
class Point extends ValueObject<{ x: number; y: number }> {
  constructor(props: { x: number; y: number }) {
    super(props);
  }

  get x(): number {
    return this.unwrap().x;
  }

  get y(): number {
    return this.unwrap().y;
  }
}

// EventTime ValueObject wrapping a Date
class EventTime extends ValueObject<{ at: Date }> {
  constructor(props: { at: Date }) {
    super(props);
  }

  get at(): Date {
    return this.unwrap().at;
  }
}

// AnotherPoint subclass to test type-based equality
class AnotherPoint extends ValueObject<{ x: number; y: number }> {
  constructor(props: { x: number; y: number }) {
    super(props);
  }
}

// ====================================
// Tests for basic ValueObject behavior
// ====================================
describe("ValueObject", () => {
  // Same type + same props → should be equal
  test("equals: same type and same props are equal", () => {
    const a = new Point({ x: 1, y: 2 });
    const b = new Point({ x: 1, y: 2 });
    expect(a.equals(b)).toBe(true);
    expect(b.equals(a)).toBe(true);
  });

  // Different type but same props → should NOT be equal
  test("equals: different type with same shape is NOT equal", () => {
    const a = new Point({ x: 1, y: 2 });
    const b = new AnotherPoint({ x: 1, y: 2 });
    expect(a.equals(b)).toBe(false);
  });

  // Note: deep equality is tested in the Bag/TestValueObject subclass below
});

// ================================
// Tests for advanced behavior
// ================================

// Generic type for helper TestValueObject
type AnyProps = { [k: string]: unknown };

describe("ValueObject - behavior", () => {
  // Test deep equality for nested objects and arrays
  test("deep equality for nested objects and arrays", () => {
    const v1 = new TestValueObject<AnyProps>({ a: { b: [1, 2, 3] } });
    const v2 = new TestValueObject<AnyProps>({ a: { b: [1, 2, 3] } });
    const v3 = new TestValueObject<AnyProps>({ a: { b: [1, 2, 4] } });

    expect(v1.equals(v2)).toBe(true);  // identical structure
    expect(v1.equals(v3)).toBe(false); // differs at nested value
  });

  // Ensure immutability: props are deeply frozen
  test("immutability: props are deeply frozen", () => {
    const point = new Point({ x: 1, y: 2 });
    const props = point.unwrap() as any; // escape readonly for mutation attempt

    // Attempting to mutate should throw TypeError
    expect(() => {
      props.x = 10;
    }).toThrow(TypeError);

    // Original values remain unchanged
    expect(point.x).toBe(1);
    expect(point.y).toBe(2);
  });

  // Validate hook is enforced on construction
  test("validate hook is enforced", () => {
    expect(() => new Email({ value: "not-an-email" })).toThrow("Invalid email");
    expect(() => new Email({ value: "user@example.com" })).not.toThrow();
  });

  // Date equality is based on timestamp
  test("dates: equality is based on time value", () => {
    const d1 = new Date("2024-01-01T00:00:00.000Z");
    const d2 = new Date("2024-01-01T00:00:00.000Z");
    const t1 = new EventTime({ at: d1 });
    const t2 = new EventTime({ at: d2 });
    const t3 = new EventTime({ at: new Date("2024-01-02T00:00:00.000Z") });

    expect(t1.equals(t2)).toBe(true);   // same timestamp
    expect(t1.equals(t3)).toBe(false);  // different timestamp
  });

  // Test serialization methods: toJSON, toString, unwrap
  test("serialization: toJSON/toString/unwrap", () => {
    const email = new Email({ value: "user@example.com" });
    expect(email.toJSON()).toEqual({ value: "user@example.com" });
    expect(email.toString()).toBe(JSON.stringify({ value: "user@example.com" }));
    expect(email.unwrap()).toEqual({ value: "user@example.com" });
  });

  // Type guard helper works correctly
  test("type guard: isValueObject", () => {
    const p = new Point({ x: 1, y: 2 });
    expect(isValueObject(p)).toBe(true);  // instance of ValueObject
    expect(isValueObject({})).toBe(false); // plain object
  });
});

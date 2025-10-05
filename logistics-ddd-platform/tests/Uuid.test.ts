import { describe, expect, test } from "bun:test";
import { Uuid } from "../src/Shared/domain/Uuid";

describe("Uuid", () => {
  // Test creating a Uuid from a valid UUID string
  test("creates from valid string", () => {
    const validV4 = "6f9619ff-8b86-4d11-b42d-00c04fc964ff";
    const id = Uuid.from(validV4); // create a ValueObject from string
    expect(id.value).toBe(validV4); // ensure value is stored correctly
  });

  // Test that invalid UUID strings throw an error
  test("throws for invalid string", () => {
    expect(() => Uuid.from("not-a-uuid")).toThrow("Invalid UUID");
  });

  // Test generating a random UUID and equality by value
  test("random generates valid uuid and equals by value", () => {
    const a = Uuid.random();          // generate random UUID
    const b = Uuid.from(a.value);     // create another object from same value
    expect(a.equals(b as any)).toBe(true); // should be equal by value
  });

  // Test that two different random UUIDs are not equal
  test("different uuids are not equal", () => {
    const a = Uuid.random();
    const b = Uuid.random();
    // Extremely unlikely to collide; ensure inequality
    expect(a.equals(b as any)).toBe(false);
  });

  // Test serialization methods: toJSON and toString
  test("serialization returns primitives", () => {
    const id = Uuid.from("6f9619ff-8b86-4d11-b42d-00c04fc964ff");
    expect(id.toJSON()).toEqual({ value: id.value });        // JSON output
    expect(id.toString()).toBe(JSON.stringify({ value: id.value })); // stringified JSON
  });
});

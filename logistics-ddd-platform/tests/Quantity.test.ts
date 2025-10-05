import { describe, expect, test } from "bun:test";
import { Quantity } from "../src/Contexts/Inventory/StockItem/domain/Quantity";

describe("Quantity", () => {
  test("creates from valid integer", () => {
    const q = Quantity.from(10);
    expect(q.value).toBe(10);
  });

  test("rejects non-integer", () => {
    expect(() => Quantity.from(1.5)).toThrow("integer");
  });

  test("rejects negative", () => {
    expect(() => Quantity.from(-1)).toThrow("negative");
  });

  test("rejects infinite or NaN", () => {
    expect(() => Quantity.from(NaN)).toThrow("finite");
    expect(() => Quantity.from(Infinity)).toThrow("finite");
  });
});



import { describe, expect, test } from "bun:test";
import { StockItemName } from "../src/Contexts/Inventory/StockItem/domain/StockItemName";

describe("StockItemName", () => {
  test("creates from valid non-empty string", () => {
    const name = StockItemName.from("Widget A");
    expect(name.value).toBe("Widget A");
  });

  test("trims whitespace but validates emptiness", () => {
    expect(() => StockItemName.from("   ")).toThrow("cannot be empty");
    const name = StockItemName.from("  Box ");
    expect(name.value).toBe("  Box "); // stored as provided; validation uses trimmed
  });

  test("rejects too long names", () => {
    const long = "x".repeat(101);
    expect(() => StockItemName.from(long)).toThrow("too long");
  });
});



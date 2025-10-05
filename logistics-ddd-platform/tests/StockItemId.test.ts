import { describe, expect, test } from "bun:test";
import { StockItemId } from "../src/Contexts/Inventory/StockItem/domain/StockItemId";

describe("StockItemId", () => {
  test("creates from valid uuid string", () => {
    const s = StockItemId.from("6f9619ff-8b86-4d11-b42d-00c04fc964ff");
    expect(s.value).toBe("6f9619ff-8b86-4d11-b42d-00c04fc964ff");
  });

  test("throws on invalid uuid string", () => {
    expect(() => StockItemId.from("bad-id")).toThrow("Invalid UUID");
  });

  test("random produces valid and equals same value", () => {
    const a = StockItemId.random();
    const b = StockItemId.from(a.value);
    expect(a.equals(b as any)).toBe(true);
  });
});



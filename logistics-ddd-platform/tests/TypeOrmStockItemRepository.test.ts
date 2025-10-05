// example integration test
import { describe, beforeAll, afterAll, beforeEach, test, expect } from "bun:test";
import { initTestDb, resetTestDb, closeTestDb, testDataSource } from "./helpers/test-db";
import { TypeOrmStockItemRepository } from "../src/Contexts/Inventory/StockItem/infrastructure/persistence/TypeOrmStockItemRepository";
import { StockItemId } from "../src/Contexts/Inventory/StockItem/domain/StockItemId";
import { StockItemName } from "../src/Contexts/Inventory/StockItem/domain/StockItemName";
import { Quantity } from "../src/Contexts/Inventory/StockItem/domain/Quantity";
import { StockItem } from "../src/Contexts/Inventory/StockItem/domain/StockItem";

describe("TypeORM repo (integration)", () => {
  let repo: TypeOrmStockItemRepository;

  beforeAll(async () => {
    await initTestDb();
    repo = TypeOrmStockItemRepository.fromDataSource(testDataSource);
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  test("save/find roundtrip", async () => {
    const id = StockItemId.from("6f9619ff-8b86-4d11-b42d-00c04fc964ff");
    const item = StockItem.add({ id, name: StockItemName.from("Widget"), quantity: Quantity.from(2) });

    await repo.save(item);
    const found = await repo.find(id);

    expect(found?.toPrimitives()).toEqual({ id: id.value, name: "Widget", quantity: 2 });
  });
});
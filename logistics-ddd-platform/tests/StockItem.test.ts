import { describe, expect, test } from "bun:test";
import { StockItem } from "../src/Contexts/Inventory/StockItem/domain/StockItem";
import { StockItemId } from "../src/Contexts/Inventory/StockItem/domain/StockItemId";
import { StockItemName } from "../src/Contexts/Inventory/StockItem/domain/StockItemName";
import { Quantity } from "../src/Contexts/Inventory/StockItem/domain/Quantity";

describe("StockItem aggregate", () => {
  test("add() creates item and records StockItemAdded event", () => {
    const id = StockItemId.from("6f9619ff-8b86-4d11-b42d-00c04fc964ff");
    const name = StockItemName.from("Widget");
    const qty = Quantity.from(3);

    const item = StockItem.add({ id, name, quantity: qty });

    // State matches inputs
    expect(item.id.value).toBe(id.value);
    expect(item.name.value).toBe("Widget");
    expect(item.quantity.value).toBe(3);

    // Event recorded
    const events = item.pullDomainEvents();
    expect(events.length).toBe(1);
    const e = events[0];
    expect(e.eventName()).toBe("inventory.stock_item.added");
    const primitives = e.toPrimitives();
    expect(primitives.aggregateId).toBe(id.value);
    expect(primitives).toMatchObject({ name: "Widget", quantity: 3 });
  });
});



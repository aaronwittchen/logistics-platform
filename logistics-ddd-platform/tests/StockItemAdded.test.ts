import { describe, expect, test } from "bun:test";
import { StockItemAdded } from "../src/Contexts/Inventory/StockItem/domain/events/StockItemAdded";
import { StockItemId } from "../src/Contexts/Inventory/StockItem/domain/StockItemId";
import { StockItemName } from "../src/Contexts/Inventory/StockItem/domain/StockItemName";
import { Quantity } from "../src/Contexts/Inventory/StockItem/domain/Quantity";
import { Uuid } from "../src/Shared/domain/Uuid";

describe("StockItemAdded event", () => {
  test("builds payload and metadata with defaults", () => {
    const aggregateId = StockItemId.from("6f9619ff-8b86-4d11-b42d-00c04fc964ff");
    const event = new StockItemAdded(
      { aggregateId },
      StockItemName.from("Widget A"),
      Quantity.from(10)
    );

    expect(event.eventName()).toBe("inventory.stock_item.added");

    const p = event.toPrimitives();
    expect(p.aggregateId).toBe(aggregateId.value);
    expect(p.eventName).toBe("inventory.stock_item.added");
    expect(typeof p.eventId).toBe("string");
    expect(typeof p.occurredOn).toBe("string");
    expect(p).toMatchObject({ name: "Widget A", quantity: 10 });
  });

  test("uses provided eventId and occurredOn", () => {
    const aggregateId = StockItemId.from("6f9619ff-8b86-4d11-b42d-00c04fc964ff");
    const eventId = Uuid.random();
    const occurredOn = new Date("2024-01-01T00:00:00.000Z");

    const event = new StockItemAdded(
      { aggregateId, eventId, occurredOn },
      StockItemName.from("Gadget"),
      Quantity.from(5)
    );

    const p = event.toPrimitives();
    expect(p.eventId).toBe(eventId.value);
    expect(p.occurredOn).toBe(occurredOn.toISOString());
  });
});



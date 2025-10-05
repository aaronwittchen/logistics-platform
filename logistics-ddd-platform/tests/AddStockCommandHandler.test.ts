import { describe, expect, mock, test } from "bun:test";
import { AddStockCommand } from "../src/Contexts/Inventory/StockItem/application/AddStock/AddStockCommand";
import { AddStockCommandHandler } from "../src/Contexts/Inventory/StockItem/application/AddStock/AddStockCommandHandler";
import type { StockItemRepository } from "../src/Contexts/Inventory/StockItem/domain/StockItemRepository";
import type { EventBus } from "../src/Shared/domain/EventBus";

function createMocks() {
  const save = mock(async () => {});
  const find = mock(async () => null);
  const del = mock(async () => {});
  const publish = mock(async (_events: unknown[]) => {});

  const repository: StockItemRepository = {
    save,
    find,
    delete: del,
  };

  const eventBus: EventBus = {
    publish,
    subscribe: () => {},
    unsubscribe: () => {},
  };

  return { repository, eventBus, save, publish };
}

describe("AddStockCommandHandler", () => {
  test("persists aggregate and publishes events", async () => {
    const { repository, eventBus, save, publish } = createMocks();
    const handler = new AddStockCommandHandler(repository, eventBus);

    const command = AddStockCommand.fromPrimitives({
      id: "6f9619ff-8b86-4d11-b42d-00c04fc964ff",
      name: "Widget",
      quantity: 5,
    });

    await handler.execute(command);

    expect(save).toHaveBeenCalledTimes(1);
    // First arg is a StockItem; we can assert its primitives
    const savedArg = save.mock.calls[0]?.[0] as any;
    expect(savedArg.toPrimitives()).toMatchObject({ id: command.id, name: command.name, quantity: command.quantity });

    expect(publish).toHaveBeenCalledTimes(1);
    const publishedEvents = publish.mock.calls[0]?.[0] as any[];
    expect(Array.isArray(publishedEvents)).toBe(true);
    expect(publishedEvents.length).toBeGreaterThan(0);
    expect(publishedEvents[0].eventName()).toBe("inventory.stock_item.added");
  });
});



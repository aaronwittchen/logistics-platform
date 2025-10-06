import type { EventBus } from "@/Shared/domain/EventBus";
import { AddStockCommand } from "./AddStockCommand";
import type { StockItemRepository } from "../../domain/StockItemRepository";
import { StockItem } from "../../domain/StockItem";
import { StockItemId } from "../../domain/StockItemId";
import { StockItemName } from "../../domain/StockItemName";
import { Quantity } from "../../domain/Quantity";

/**
 * AddStockCommandHandler
 *
 * Application layer service (use case handler) for adding a stock item.
 *
 * Responsibilities:
 * - Receive an AddStockCommand from the interface layer (controller, API, etc.)
 * - Orchestrate creation of StockItem aggregate with proper ValueObjects
 * - Persist the aggregate via the repository
 * - Publish any domain events recorded by the aggregate
 */
export class AddStockCommandHandler {
  constructor(
    private readonly repository: StockItemRepository,
    private readonly eventBus?: EventBus
  ) {}

  /**
   * Executes the "Add Stock" use case.
   *
   * @param command - the AddStockCommand containing input data
   */
  async execute(command: AddStockCommand): Promise<void> {
    // Convert primitive command data to domain-specific ValueObjects
    const id = StockItemId.from(command.id);
    const name = StockItemName.from(command.name);
    const quantity = Quantity.from(command.quantity);

    // Create a new StockItem aggregate
    const item: StockItem = StockItem.add({ id, name, quantity });

    // Persist the aggregate
    await this.repository.save(item);

    // Publish any domain events emitted during aggregate creation
    if (this.eventBus) {
      const events = item.pullDomainEvents();
      if (events.length > 0) {
        await this.eventBus.publish(events);
      }
    }
  }
}

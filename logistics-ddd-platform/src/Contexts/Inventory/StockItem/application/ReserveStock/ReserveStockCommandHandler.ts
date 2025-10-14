import type { EventBus } from '@/Shared/domain/EventBus';
import { ReserveStockCommand } from './ReserveStockCommand';
import type { StockItemRepository } from '../../domain/StockItemRepository';
import { StockItemId } from '../../domain/StockItemId';
import { Quantity } from '../../domain/Quantity';

/**
 * ReserveStockCommandHandler
 *
 * Application layer service (use case handler) for reserving stock from an item.
 *
 * Responsibilities:
 * - Receive a ReserveStockCommand from the interface layer (controller, API, etc.)
 * - Find the existing StockItem aggregate
 * - Execute the reserve operation with proper validation
 * - Persist the updated aggregate via the repository
 * - Publish any domain events recorded during the operation
 */
export class ReserveStockCommandHandler {
  constructor(
    private readonly repository: StockItemRepository,
    private readonly eventBus?: EventBus
  ) {}

  /**
   * Executes the "Reserve Stock" use case.
   *
   * @param command - the ReserveStockCommand containing input data
   * @throws Error if stock item not found or insufficient quantity
   */
  async execute(command: ReserveStockCommand): Promise<void> {
    // Convert primitive command data to domain-specific ValueObjects
    const id = StockItemId.from(command.id);
    const quantity = Quantity.from(command.quantity);

    // Find the existing StockItem aggregate
    const stockItem = await this.repository.find(id);

    if (!stockItem) {
      throw new Error('Stock item not found');
    }

    // Reserve the specified quantity (this will throw if insufficient stock)
    stockItem.reserve(quantity, command.reservationId);

    // Persist the updated aggregate
    await this.repository.save(stockItem);

    // Publish any domain events emitted during the reserve operation
    if (this.eventBus) {
      const events = stockItem.pullDomainEvents();
      if (events.length > 0) {
        await this.eventBus.publish(events);
      }
    }
  }
}
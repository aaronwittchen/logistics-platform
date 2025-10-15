import { StockItemAdded } from '@/Contexts/Inventory/StockItem/domain/events/StockItemAdded';
import { DomainEventSubscriber } from '@/Shared/domain/DomainEventSubscriber';
import { log } from '@/utils/log';

export class StockItemAddedLogger implements DomainEventSubscriber<StockItemAdded> {
  subscribedTo() {
    return [
      {
        EVENT_NAME: 'inventory.stock_item.added',
        fromPrimitives: StockItemAdded.fromPrimitives,
      },
    ];
  }

  async on(event: StockItemAdded): Promise<void> {
    log.info(`Stock item added: ${event.name} (Qty: ${event.quantity})`);
  }
}

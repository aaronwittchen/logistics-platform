import { StockItemAdded } from '../../domain/events/StockItemAdded';
import { StockItemId } from '../../domain/StockItemId';
import { StockItemName } from '../../domain/StockItemName';
import { Quantity } from '../../domain/Quantity';
import { Uuid } from '@/Shared/domain/Uuid';
import { DomainEventSubscriber } from '@/Shared/domain/DomainEventSubscriber';
import { log } from '@/utils/log';

export class StockItemAddedLogger
  implements DomainEventSubscriber<StockItemAdded>
{
  subscribedTo() {
    return [{
      EVENT_NAME: 'inventory.stock_item.added',
      fromPrimitives: (data: any) => {
        const { aggregateId, id: eventId, occurredOn, attributes } = data;
        const { name, quantity } = attributes;

        // Handle both old format (objects) and new format (strings)
        const aggregateIdValue = typeof aggregateId === 'string' ? aggregateId : aggregateId?.value;
        const eventIdValue = typeof eventId === 'string' ? eventId : eventId?.value;

        return new StockItemAdded(
          {
            aggregateId: StockItemId.from(aggregateIdValue),
            eventId: Uuid.from(eventIdValue),
            occurredOn: new Date(occurredOn)
          },
          StockItemName.from(name),
          Quantity.from(quantity)
        );
      }
    }];
  }

  async on(event: StockItemAdded): Promise<void> {
    log.info(`Stock item added: ${event.name} (Qty: ${event.quantity})`);
  }
}
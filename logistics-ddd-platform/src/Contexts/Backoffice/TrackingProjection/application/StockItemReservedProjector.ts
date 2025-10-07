import { DomainEventSubscriber } from '@/Shared/domain/DomainEventSubscriber';
import { StockItemReserved } from '../../../Inventory/StockItem/domain/events/StockItemReserved';
import { TrackingProjectionRepository } from '../domain/TrackingProjectionRepository';
import { TrackingView } from '../domain/TrackingView';
import { Quantity } from '../../../Inventory/StockItem/domain/Quantity';
import { log } from '@/utils/log';

export class StockItemReservedProjector
  implements DomainEventSubscriber<StockItemReserved>
{
  constructor(private readonly repository: TrackingProjectionRepository) {}

  subscribedTo() {
    return [{
      EVENT_NAME: 'inventory.stock_item.reserved',
      fromPrimitives: (data: any) => {
        const { aggregateId, eventId, occurredOn, id, quantity, reservationId } = data;
        return new StockItemReserved(
          {
            aggregateId,
            eventId,
            occurredOn: new Date(occurredOn)
          },
          id,
          Quantity.from(quantity),
          reservationId
        );
      }
    }];
  }

  async on(event: StockItemReserved): Promise<void> {
    // Check if projection already exists
    const existing = await this.repository.findByReservationId(event.reservationIdentifier);

    const tracking: TrackingView = {
        id: event.reservationIdentifier,
        stockItemId: event.stockItemId,
        stockItemName: 'Unknown', // Will be updated when we have more data
        reservedQuantity: event.reservedQuantity,
        reservationId: event.reservationIdentifier,
        status: 'reserved',
        createdAt: event.occurredOn,
        updatedAt: event.occurredOn,
      };

      if (existing) {
        // Update existing projection
        await this.repository.update(existing.id, {
          reservedQuantity: event.reservedQuantity,
          status: 'reserved',
          updatedAt: event.occurredOn,
        });
    } else {
      // Create new projection
      await this.repository.save(tracking);
    }

    log.info(`Projection updated for reservation: ${event.reservationIdentifier}`);
}
}
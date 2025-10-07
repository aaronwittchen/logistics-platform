import { DomainEventSubscriber } from '@/Shared/domain/DomainEventSubscriber';
import { StockItemReserved } from '../../../../Inventory/StockItem/domain/events/StockItemReserved';
import { Package } from '../../domain/Package';
import { PackageId } from '../../domain/PackageId';
import { TrackingNumber } from '../../domain/TrackingNumber';
import { PackageRepository } from '../../domain/PackageRepository';
import { log } from '@/utils/log';

export class CreatePackageOnStockReserved
  implements DomainEventSubscriber<StockItemReserved>
{
  constructor(private readonly repository: PackageRepository) {}

  subscribedTo() {
    return [{
      EVENT_NAME: 'inventory.stock_item.reserved',
      fromPrimitives: StockItemReserved.fromPrimitives,
    }];
  }

  async on(event: StockItemReserved): Promise<void> {
    const pkg = Package.register(
      PackageId.random(),
      TrackingNumber.generate(),
      event.reservationIdentifier
    );

    await this.repository.save(pkg);

    log.info(`Package created for reservation: ${event.reservationIdentifier}`);
  }
}
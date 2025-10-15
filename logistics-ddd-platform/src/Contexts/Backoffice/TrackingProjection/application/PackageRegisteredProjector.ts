import { DomainEventSubscriber } from '@/Shared/domain/DomainEventSubscriber';
import { PackageRegistered } from '@/Contexts/Logistics/Package/domain/events/PackageRegistered';
import { TrackingProjectionRepository } from '../domain/TrackingProjectionRepository';
import { log } from '@/utils/log';

export class PackageRegisteredProjector implements DomainEventSubscriber<PackageRegistered> {
  constructor(private readonly repository: TrackingProjectionRepository) {}

  subscribedTo() {
    return [
      {
        EVENT_NAME: PackageRegistered.EVENT_NAME,
        fromPrimitives: PackageRegistered.fromPrimitives,
      },
    ];
  }

  async on(event: PackageRegistered): Promise<void> {
    // Update the tracking projection with package information
    await this.repository.update(event.reservationId, {
      status: 'registered',
      updatedAt: event.occurredOn,
    });

    log.info(`Tracking projection updated with package: ${event.trackingNumber}`);
  }
}

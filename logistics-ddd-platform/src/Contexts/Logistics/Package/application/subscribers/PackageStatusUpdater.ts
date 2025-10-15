import { DomainEventSubscriber } from '@/Shared/domain/DomainEventSubscriber';
import { PackageRegistered } from '@/Contexts/Logistics/Package/domain/events/PackageRegistered';
import { PackageRepository } from '@/Contexts/Logistics/Package/domain/PackageRepository';
import { PackageId } from '@/Contexts/Logistics/Package/domain/PackageId';
import { ConsumerMetrics } from '@/apps/logistics/consumers/start';
import { ConsumerErrorHandler } from '@/apps/logistics/consumers/start';
import { log } from '@/utils/log';

export class PackageStatusUpdater implements DomainEventSubscriber<PackageRegistered> {
  constructor(
    private readonly repository: PackageRepository,
    private readonly metrics: ConsumerMetrics,
    private readonly errorHandler: ConsumerErrorHandler,
  ) {}

  subscribedTo() {
    return [
      {
        EVENT_NAME: PackageRegistered.EVENT_NAME,
        fromPrimitives: PackageRegistered.fromPrimitives,
      },
    ];
  }

  async on(event: PackageRegistered): Promise<void> {
    const startTime = Date.now();

    try {
      // Find the package that was just registered
      const pkg = await this.repository.find(PackageId.from(event.packageId));
      if (!pkg) {
        log.warn(`Package ${event.packageId} not found for status update`);
        return;
      }

      // Update package status (example: mark as processing)
      // pkg.updateStatus('processing');
      // await this.repository.save(pkg);

      const processingTime = Date.now() - startTime;
      this.metrics.recordEventProcessed(PackageRegistered.EVENT_NAME, processingTime);

      log.info(`Package ${event.packageId} status updated`);
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        subscriber: 'PackageStatusUpdater',
        eventName: PackageRegistered.EVENT_NAME,
      });
      this.metrics.recordEventFailed(PackageRegistered.EVENT_NAME);
      throw error;
    }
  }
}

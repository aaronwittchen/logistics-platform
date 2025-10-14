import { DomainEventSubscriber } from '@/Shared/domain/DomainEventSubscriber';
import { PackageRegistered } from '../../domain/events/PackageRegistered';
import { PackageRepository } from '../../domain/PackageRepository';
import { PackageId } from '../../domain/PackageId';
import { ConsumerMetrics } from '@/apps/logistics/consumers/start';
import { ConsumerErrorHandler } from '@/apps/logistics/consumers/start';
import { log } from '@/utils/log';

export class PackageDeliveryTracker implements DomainEventSubscriber<PackageRegistered> {
  constructor(
    private readonly repository: PackageRepository,
    private readonly metrics: ConsumerMetrics,
    private readonly errorHandler: ConsumerErrorHandler
  ) {}

  subscribedTo() {
    return [{
      EVENT_NAME: PackageRegistered.EVENT_NAME,
      fromPrimitives: PackageRegistered.fromPrimitives,
    }];
  }

  async on(event: PackageRegistered): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Find the package that was just registered
      const pkg = await this.repository.find(PackageId.from(event.packageId));
      if (!pkg) {
        log.warn(`Package ${event.packageId} not found for delivery tracking`);
        return;
      }

      // Mark package as in transit for delivery
      pkg.markInTransit();
        await this.repository.save(pkg);
        
        // Send tracking notification to customer
      await this.sendTrackingNotification(event.packageTrackingNumber);
        
        // Update external shipping provider
        await this.updateShippingProvider(event);

      // Initialize delivery tracking record
      await this.initializeDeliveryTracking(event);

      const processingTime = Date.now() - startTime;
      this.metrics.recordEventProcessed(PackageRegistered.EVENT_NAME, processingTime);
      
      log.info(`Package ${event.packageId} delivery tracking initialized`);
      
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        subscriber: 'PackageDeliveryTracker',
        eventName: PackageRegistered.EVENT_NAME,
      });
      this.metrics.recordEventFailed(PackageRegistered.EVENT_NAME);
      throw error;
    }
  }

  private async sendTrackingNotification(trackingNumber: string): Promise<void> {
    // Implementation for sending tracking notifications to customers
    // This could integrate with email service, SMS service, etc.
    log.info(`Sending delivery tracking notification for package ${trackingNumber}`);
    
    // Example implementation:
    // await this.notificationService.sendEmail({
    //   to: customer.email,
    //   subject: 'Your package is on the way!',
    //   template: 'package-shipped',
    //   data: { trackingNumber, estimatedDelivery }
    // });
  }

  private async updateShippingProvider(event: PackageRegistered): Promise<void> {
    // Implementation for updating external shipping provider systems
    // This could integrate with shipping APIs like UPS, FedEx, DHL, etc.
    log.info(`Updating shipping provider for package ${event.packageId}`);
    
    // Example implementation:
    // await this.shippingProviderApi.createShipment({
    //   trackingNumber: event.packageTrackingNumber,
    //   origin: 'warehouse',
    //   destination: customer.address,
    //   package: { weight, dimensions }
    // });
  }

  private async initializeDeliveryTracking(event: PackageRegistered): Promise<void> {
    // Implementation for initializing delivery tracking record
    // This could create a delivery tracking entity in the database
    log.info(`Initializing delivery tracking record for package ${event.packageId}`);
    
    // Example implementation:
    // const trackingRecord = new DeliveryTracking({
    //   packageId: event.packageId,
    //   trackingNumber: event.packageTrackingNumber,
    //   status: 'in_transit',
    //   estimatedDelivery: calculateEstimatedDelivery(),
    //   checkpoints: []
    // });
    // await this.deliveryTrackingRepository.save(trackingRecord);
  }
}

import { DomainEventSubscriber } from '@/Shared/domain/DomainEventSubscriber';
import { StockItemReserved } from '@/Contexts/Inventory/StockItem/domain/events/StockItemReserved';
import { PackageRepository } from '@/Contexts/Logistics/Package/domain/PackageRepository';
import { ConsumerMetrics } from '@/apps/logistics/consumers/start';
import { ConsumerErrorHandler } from '@/apps/logistics/consumers/start';
import { log } from '@/utils/log';

export class InventoryReservationMonitor implements DomainEventSubscriber<StockItemReserved> {
  constructor(
    private readonly repository: PackageRepository,
    private readonly metrics: ConsumerMetrics,
    private readonly errorHandler: ConsumerErrorHandler,
  ) {}

  subscribedTo() {
    return [
      {
        EVENT_NAME: 'inventory.stock_item.reserved',
        fromPrimitives: StockItemReserved.fromPrimitives,
      },
    ];
  }

  async on(event: StockItemReserved): Promise<void> {
    const startTime = Date.now();

    try {
      // Monitor inventory reservation for potential issues
      await this.monitorReservationCapacity(event);

      // Check if reservation affects existing packages
      await this.checkReservationImpact(event);

      // Update reservation monitoring records
      await this.updateReservationMetrics(event);

      // Send alerts if reservation thresholds are exceeded
      await this.checkReservationThresholds(event);

      const processingTime = Date.now() - startTime;
      this.metrics.recordEventProcessed('inventory.stock_item.reserved', processingTime);

      log.info(`Inventory reservation ${event.reservationIdentifier} monitored successfully`);
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        subscriber: 'InventoryReservationMonitor',
        eventName: StockItemReserved.EVENT_NAME,
      });
      this.metrics.recordEventFailed(StockItemReserved.EVENT_NAME);
      throw error;
    }
  }

  private async monitorReservationCapacity(event: StockItemReserved): Promise<void> {
    // Monitor if the reservation quantity is reasonable compared to available stock
    const stockItem = await this.getStockItemDetails(event.stockItemId);

    if (stockItem && event.reservedQuantity > stockItem.availableQuantity * 0.9) {
      log.warn(
        `High reservation percentage for stock item ${event.stockItemId}: ${event.reservedQuantity}/${stockItem.availableQuantity}`,
      );

      // Could trigger alerts or notifications here
      // await this.alertService.sendAlert({
      //   type: 'HIGH_RESERVATION_WARNING',
      //   stockItemId: event.stockItemId,
      //   reservedQuantity: event.reservedQuantity,
      //   availableQuantity: stockItem.availableQuantity
      // });
    }
  }

  private async checkReservationImpact(event: StockItemReserved): Promise<void> {
    // Check if this reservation impacts existing package deliveries
    const affectedPackages = (await this.repository.findAll()).filter(
      pkg => pkg.getReservationId() === event.reservationIdentifier,
    );

    if (affectedPackages.length > 0) {
      log.info(`Reservation ${event.reservationIdentifier} affects ${affectedPackages.length} existing packages`);

      // Could trigger package status updates or notifications
      // for (const pkg of affectedPackages) {
      //   await this.updatePackageDeliveryEstimate(pkg, event);
      // }
    }
  }

  private async updateReservationMetrics(event: StockItemReserved): Promise<void> {
    // Update monitoring metrics for the reservation
    log.info(`Updating reservation metrics for ${event.reservationIdentifier}`);

    // Example implementation:
    // await this.reservationMetricsRepository.update({
    //   reservationId: event.reservationIdentifier,
    //   stockItemId: event.stockItemId,
    //   reservedQuantity: event.reservedQuantity,
    //   timestamp: new Date(),
    //   status: 'active'
    // });
  }

  private async checkReservationThresholds(event: StockItemReserved): Promise<void> {
    // Check if reservation exceeds configured thresholds
    const thresholds = await this.getReservationThresholds(event.stockItemId);

    if (event.reservedQuantity > thresholds.maximumReservation) {
      log.err(
        `Reservation ${event.reservationIdentifier} exceeds maximum threshold: ${event.reservedQuantity} > ${thresholds.maximumReservation}`,
      );

      // Could trigger escalation procedures
      // await this.escalationService.handleThresholdExceeded({
      //   reservationId: event.reservationIdentifier,
      //   stockItemId: event.stockItemId,
      //   exceededThreshold: event.reservedQuantity
      // });
    }
  }

  private async getStockItemDetails(stockItemId: string): Promise<{ availableQuantity: number } | null> {
    // Implementation to fetch stock item details
    // This would typically query the inventory repository
    log.info(`Fetching stock item details for ${stockItemId}`);

    // Example implementation:
    // const stockItem = await this.inventoryRepository.find(stockItemId);
    // return stockItem ? { availableQuantity: stockItem.availableQuantity } : null;

    return null; // Placeholder
  }

  private async getReservationThresholds(stockItemId: string): Promise<{ maximumReservation: number }> {
    // Implementation to fetch reservation thresholds
    log.info(`Fetching reservation thresholds for ${stockItemId}`);

    // Example implementation:
    // const thresholds = await this.thresholdRepository.findByStockItem(stockItemId);
    // return thresholds || { maximumReservation: 1000 };

    return { maximumReservation: 1000 }; // Placeholder
  }
}

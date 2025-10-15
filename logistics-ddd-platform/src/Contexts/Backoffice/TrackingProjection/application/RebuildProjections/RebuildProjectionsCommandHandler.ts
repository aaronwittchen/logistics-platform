import { StockItemRepository } from '@/Contexts/Inventory/StockItem/domain/StockItemRepository';
import { PackageRepository } from '@/Contexts/Logistics/Package/domain/PackageRepository';
import { StockItem } from '@/Contexts/Inventory/StockItem/domain/StockItem';
import { Package } from '@/Contexts/Logistics/Package/domain/Package';
import { TrackingProjectionRepository } from '../../domain/TrackingProjectionRepository';
import { TrackingView } from '../../domain/TrackingView';
import { RebuildProjectionsCommand } from './RebuildProjectionsCommand';
import { log } from '@/utils/log';

export class RebuildProjectionsCommandHandler {
  constructor(
    private readonly stockItemRepository: StockItemRepository,
    private readonly packageRepository: PackageRepository,
    private readonly trackingRepository: TrackingProjectionRepository,
  ) {}

  async execute(_command: RebuildProjectionsCommand): Promise<void> {
    log.info('Starting projection rebuild process...');

    // 1. Clear existing projections
    await this.trackingRepository.clearAll();
    log.ok('Cleared existing projections');

    // 2. Get all stock items and packages from current state
    const stockItems = await this.stockItemRepository.findAll();
    const packages = await this.packageRepository.findAll();

    log.info(`Found ${stockItems.length} stock items and ${packages.length} packages to process`);

    // 3. Rebuild projections from current aggregate state
    await this.rebuildFromStockItems(stockItems);
    await this.rebuildFromPackages(packages);

    const totalProjections = await this.trackingRepository.count();
    log.ok(`Projection rebuild completed. Created ${totalProjections} tracking projections`);
  }

  private async rebuildFromStockItems(stockItems: StockItem[]): Promise<void> {
    for (const stockItem of stockItems) {
      // Create tracking projection for each stock item
      const tracking: TrackingView = {
        id: `stock-${stockItem.id.value}`,
        stockItemId: stockItem.id.value,
        stockItemName: stockItem.name.value,
        reservedQuantity: 0, // No reservations in current state
        reservationId: '',
        status: 'registered', // Changed from 'available' to 'registered'
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.trackingRepository.save(tracking);
    }
  }

  private async rebuildFromPackages(packages: Package[]): Promise<void> {
    for (const pkg of packages) {
      // Create or update tracking projection for each package
      const tracking: TrackingView = {
        id: pkg.getId().value,
        stockItemId: '', // We don't have direct relation in current data model
        stockItemName: 'Package',
        reservedQuantity: 1,
        reservationId: pkg.getReservationId(),
        status: pkg.getStatus() === 'uninitialized' ? 'registered' as const : pkg.getStatus() as 'registered' | 'in_transit' | 'delivered',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.trackingRepository.save(tracking);
    }
  }
}
import { Repository } from 'typeorm';
import { Package } from '@/Contexts/Logistics/Package/domain/Package';
import { PackageId } from '@/Contexts/Logistics/Package/domain/PackageId';
import { PackageRepository } from '@/Contexts/Logistics/Package/domain/PackageRepository';
import { PackageEntity } from './PackageEntity';
import { EventBus } from '@/Shared/domain/EventBus';
import { AppDataSource } from '@/Shared/infrastructure/persistence/TypeOrmConfig';

export class TypeOrmPackageRepository implements PackageRepository {
  private repository: Repository<PackageEntity>;

  constructor(private readonly eventBus?: EventBus) {
    this.repository = AppDataSource.getRepository(PackageEntity);
  }

  async save(pkg: Package): Promise<void> {
    const entity = PackageEntity.fromDomain(pkg);

    await this.repository.save(entity);

    // Publish domain events
    if (this.eventBus) {
      const events = pkg.pullDomainEvents();
      await this.eventBus.publish(events);
    }
  }

  async find(id: PackageId): Promise<Package | null> {
    const entity = await this.repository.findOne({
      where: { id: id.value },
    });

    if (!entity) {
      return null;
    }

    return Package.fromPrimitives({
      id: entity.id,
      trackingNumber: entity.trackingNumber,
      reservationId: entity.reservationId,
      status: entity.status,
    });
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Package | null> {
    const entity = await this.repository.findOne({
      where: { trackingNumber },
    });

    if (!entity) {
      return null;
    }

    return Package.fromPrimitives({
      id: entity.id,
      trackingNumber: entity.trackingNumber,
      reservationId: entity.reservationId,
      status: entity.status,
    });
  }

  async findAll(): Promise<Package[]> {
    const entities = await this.repository.find();

    return entities.map(entity =>
      Package.fromPrimitives({
        id: entity.id,
        trackingNumber: entity.trackingNumber,
        reservationId: entity.reservationId,
        status: entity.status,
      }),
    );
  }

  async delete(id: PackageId): Promise<void> {
    await this.repository.delete(id.value);
  }
}

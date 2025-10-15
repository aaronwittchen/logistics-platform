import { PackageRepository } from '../../domain/PackageRepository';
import { PackageId } from '../../domain/PackageId';
import { UpdateLocationCommand } from './UpdateLocationCommand';

export class UpdateLocationCommandHandler {
  constructor(private readonly repository: PackageRepository) {}

  async execute(command: UpdateLocationCommand): Promise<void> {
    const packageId = PackageId.from(command.packageId);
    const pkg = await this.repository.find(packageId);
    if (!pkg) {
      throw new Error('Package not found');
    }

    pkg.updateLocation(command.newLocation);
    await this.repository.save(pkg);
  }
}

import { Uuid } from '@/Shared/domain/Uuid';

export class PackageId extends Uuid {
  /**
   * Generate a new random PackageId.
   *
   * @returns a new PackageId instance
   */
  static random(): PackageId {
    return new PackageId(Uuid.random().value);
  }

  /**
   * Create a PackageId from an existing UUID string.
   *
   * @param value - a valid UUID string
   * @returns a new PackageId instance
   */
  static from(value: string): PackageId {
    return new PackageId(value);
  }
}

import { AggregateRoot } from '@/Shared/domain/AggregateRoot';
import { PackageId } from './PackageId';
import { TrackingNumber } from './TrackingNumber';
import { PackageRegistered } from './events/PackageRegistered';

/**
 * Interface representing the primitive (serializable) shape of a Package.
 */
export interface PackagePrimitives {
  id: string;
  trackingNumber: string;
  reservationId: string;
  status: 'uninitialized' | 'registered' | 'in_transit' | 'delivered';
}

/**
 * Package
 *
 * AggregateRoot representing a Package in the logistics domain.
 *
 * Responsibilities:
 * - Encapsulate Package state (id, tracking number, reservation, status)
 * - Ensure invariants and consistency via AggregateRoot
 * - Emit domain events on important state changes
 * - Manage package lifecycle from registration to delivery
 */
export class Package extends AggregateRoot {
  private status: 'uninitialized' | 'registered' | 'in_transit' | 'delivered' = 'uninitialized';

  /**
   * Private constructor to enforce creation through the static `register` method.
   */
  private constructor(
    private readonly id: PackageId,
    private readonly trackingNumber: TrackingNumber,
    private readonly reservationId: string
  ) {
    super();
  }

  /**
   * Factory method to register a new Package and record the "PackageRegistered" domain event.
   *
   * @param id - the PackageId for the new package
   * @param trackingNumber - the TrackingNumber for shipping
   * @param reservationId - the stock reservation this package fulfills
   * @returns a new Package instance
   */
  static register(
    id: PackageId,
    trackingNumber: TrackingNumber,
    reservationId: string
  ): Package {
    const pkg = new Package(id, trackingNumber, reservationId);

    // Set status to registered since this is a properly registered package
    (pkg as any).status = 'registered';

    // Record a domain event for the package registration
    pkg.record(
      new PackageRegistered(
        id.value,
        trackingNumber.value,
        reservationId
      )
    );

    return pkg;
  }

  /**
   * Mark package as in transit
   */
  markInTransit(): void {
    if (this.status !== 'registered') {
      throw new Error('Package must be registered before transit');
    }
    this.status = 'in_transit';
  }

  /**
   * Mark package as delivered
   */
  markDelivered(): void {
    if (this.status !== 'in_transit') {
      throw new Error('Package must be in transit before delivery');
    }
    this.status = 'delivered';
  }

  /** Getter for the Package ID */
  getId(): PackageId {
    return this.id;
  }

  /** Getter for the Tracking Number */
  getTrackingNumber(): TrackingNumber {
    return this.trackingNumber;
  }

  /** Getter for the Reservation ID */
  getReservationId(): string {
    return this.reservationId;
  }

  /** Getter for the Package Status */
  getStatus(): "uninitialized" | "registered" | "in_transit" | "delivered" {
    return this.status;
  }

  /**
   * Convert the Package to a plain object for serialization or external use.
   */
  toPrimitives(): PackagePrimitives {
    return {
      id: this.id.value,
      trackingNumber: this.trackingNumber.value,
      reservationId: this.reservationId,
      status: this.status,
    };
  }

  /**
   * Factory method to reconstruct an existing Package from primitive data.
   * Does not trigger domain events since this represents loading an existing package.
   *
   * @param primitives - the primitive data to reconstruct from
   * @returns a Package instance
   */
  static fromPrimitives(primitives: PackagePrimitives): Package {
    const pkg = new Package(
      new PackageId(primitives.id),
      new TrackingNumber(primitives.trackingNumber),
      primitives.reservationId
    );

    // Set the status directly since we're loading an existing package
    (pkg as any).status = primitives.status;

    return pkg;
  }
}
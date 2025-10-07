import { Column, Entity, PrimaryColumn } from "typeorm";
import { Package } from "../../domain/Package";
import { PackageId } from "../../domain/PackageId";
import { TrackingNumber } from "../../domain/TrackingNumber";

/**
 * TypeORM entity representing the Package table in the database.
 *
 * Responsibilities:
 * - Define the database schema for packages
 * - Map between database rows and domain aggregates
 */
@Entity({ name: "packages" })
export class PackageEntity {
  /** Primary key (UUID string) */
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  /** Package tracking number (10 character alphanumeric) */
  @Column({ type: "varchar", length: 10 })
  trackingNumber!: string;

  /** Associated stock reservation ID */
  @Column({ type: "varchar", length: 36 })
  reservationId!: string;

    /** Package status */
    @Column({ type: "varchar", length: 20 })
    status!: "registered" | "in_transit" | "delivered";

  /**
   * Converts a Package domain aggregate into a TypeORM entity.
   * Used before persisting to the database.
   *
   * @param domain - the Package aggregate
   * @returns a PackageEntity ready for persistence
   */
  static fromDomain(domain: Package): PackageEntity {
    const e = new PackageEntity();
    e.id = domain.getId().value;
    e.trackingNumber = domain.getTrackingNumber().value;
    e.reservationId = domain.getReservationId();
    e.status = domain.getStatus();
    return e;
  }

  /**
   * Converts this database entity back into a Package domain aggregate.
   *
   * @returns a Package aggregate
   */
  toDomain(): Package {
    return Package.fromPrimitives({
      id: this.id,
      trackingNumber: this.trackingNumber,
      reservationId: this.reservationId,
      status: this.status,
    });
  }
}
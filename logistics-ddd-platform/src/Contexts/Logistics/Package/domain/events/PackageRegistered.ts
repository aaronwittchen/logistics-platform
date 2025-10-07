import { DomainEvent } from '@/Shared/domain/DomainEvent';
import { Uuid } from '@/Shared/domain/Uuid';

/**
 * PackageRegistered
 *
 * A domain event representing the registration of a new package in the logistics system.
 *
 * Responsibilities:
 * - Capture the essential data when a package is registered
 * - Provide serialization for event publishing
 * - Enable tracking of package creation across contexts
 */
export class PackageRegistered extends DomainEvent {
  /** Static event name for this domain event */
  static EVENT_NAME = 'logistics.package.registered';

  /**
   * Constructor
   *
   * @param id - the PackageId as string
   * @param trackingNumber - the tracking number for the package
   * @param reservationId - the reservation this package fulfills
   * @param eventId - optional unique ID for this event instance
   * @param occurredOn - optional timestamp (defaults to current time)
   */
  constructor(
    public readonly id: string,
    public readonly trackingNumber: string,
    public readonly reservationId: string,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      aggregateId: Uuid.from(id),
      eventId: eventId ? Uuid.from(eventId) : undefined,
      occurredOn
    });
  }

  /** Returns the event name */
  public eventName(): string {
    return PackageRegistered.EVENT_NAME;
  }

  /** Returns the package ID */
  get packageId(): string {
    return this.id;
  }

  /** Returns the tracking number */
  get packageTrackingNumber(): string {
    return this.trackingNumber;
  }

  /** Returns the reservation ID this package fulfills */
  get fulfilledReservationId(): string {
    return this.reservationId;
  }

  /** Returns the payload to be serialized when the event is published */
  protected toPayload() {
    return {
      id: this.id,
      trackingNumber: this.trackingNumber,
      reservationId: this.reservationId,
    };
  }

  /**
   * Static factory method to create from primitives
   *
   * @param params - serialized event data
   * @returns new PackageRegistered instance
   */
  static fromPrimitives(params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: { id: string; trackingNumber: string; reservationId: string };
  }): PackageRegistered {
    return new PackageRegistered(
      params.attributes.id,
      params.attributes.trackingNumber,
      params.attributes.reservationId,
      params.eventId,
      params.occurredOn
    );
  }
}
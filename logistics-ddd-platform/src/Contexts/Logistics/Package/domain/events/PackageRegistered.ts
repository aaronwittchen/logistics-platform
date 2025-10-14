import { DomainEvent, DomainEventPrimitives } from '@/Shared/domain/DomainEvent';
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
   * @param primitives - serialized event data
   * @returns new PackageRegistered instance
   */
  static fromPrimitives(primitives: DomainEventPrimitives): PackageRegistered {
    // Handle both direct payload format and nested attributes format
    const payload = (primitives as any).attributes || primitives;
    
    // Map RabbitMQ message structure to DomainEventPrimitives structure
    const eventPrimitives: DomainEventPrimitives = {
      aggregateId: primitives.aggregateId,
      eventId: (primitives as any).id || primitives.eventId,
      occurredOn: primitives.occurredOn,
      eventName: (primitives as any).type || primitives.eventName,
      eventVersion: payload.eventVersion,
      ...payload
    };
    
    return new PackageRegistered(
      eventPrimitives.id as string,
      eventPrimitives.trackingNumber as string,
      eventPrimitives.reservationId as string,
      eventPrimitives.eventId,
      new Date(eventPrimitives.occurredOn)
    );
  }
}
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
  public readonly id: string; // Add this property declaration
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
    params: { aggregateId: Uuid; eventId?: Uuid; occurredOn?: Date },
    public readonly trackingNumber: string,
    public readonly reservationId: string,
  ) {
    super(params);
    this.id = params.aggregateId.value; // Add this property
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
    // Handle different possible message formats more safely
    const payload =
      'attributes' in primitives
        ? (primitives as DomainEventPrimitives & { attributes: Record<string, unknown> }).attributes
        : primitives;

    // Map RabbitMQ message structure to DomainEventPrimitives structure
    const eventPrimitives: DomainEventPrimitives = {
      aggregateId: primitives.aggregateId,
      eventId: 'id' in primitives ? (primitives as DomainEventPrimitives & { id: string }).id : primitives.eventId,
      occurredOn: primitives.occurredOn,
      eventName:
        'type' in primitives ? (primitives as DomainEventPrimitives & { type: string }).type : primitives.eventName,
      eventVersion: payload.eventVersion,
      ...payload,
    };

    return new PackageRegistered(
      {
        aggregateId: Uuid.from(eventPrimitives.id as string),
        eventId: eventPrimitives.eventId ? Uuid.from(eventPrimitives.eventId) : undefined,
        occurredOn: new Date(eventPrimitives.occurredOn),
      },
      eventPrimitives.trackingNumber as string,
      eventPrimitives.reservationId as string,
    );
  }
}

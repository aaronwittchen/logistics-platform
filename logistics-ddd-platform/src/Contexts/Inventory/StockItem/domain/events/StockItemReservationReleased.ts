import { DomainEvent, DomainEventPrimitives } from '@/Shared/domain/DomainEvent';
import { Uuid } from '@/Shared/domain/Uuid';
import { StockItemId } from '../StockItemId';
import { Quantity } from '../Quantity';

/**
 * Payload shape for the StockItemReservationReleased event.
 *
 * Defines the data that will be serialized when the event is published.
 */
export interface StockItemReservationReleasedPayload {
  stockItemId: string; // stock item ID
  releasedQuantity: number; // quantity that was released
  reservationIdentifier: string; // unique reservation identifier that was released
  reason?: string; // optional reason for the release
}

/**
 * StockItemReservationReleased
 *
 * A domain event representing the release of a stock item reservation.
 *
 * Responsibilities:
 * - Capture the relevant state when a reservation is released
 * - Provide serialization for event publishing
 * - Enable tracking of reservation lifecycle
 */
export class StockItemReservationReleased extends DomainEvent<StockItemReservationReleasedPayload> {
  /** Static event name for this domain event */
  static EVENT_NAME = 'inventory.stock_item.reservation_released';

  /**
   * Constructor
   *
   * @param params - metadata for the domain event (aggregateId, optional eventId, optional timestamp)
   * @param id - the StockItemId of the item whose reservation was released
   * @param quantity - the Quantity that was released
   * @param reservationId - unique identifier for the released reservation
   * @param reason - optional reason for the release
   */
  constructor(
    params: { aggregateId: Uuid; eventId?: Uuid; occurredOn?: Date },
    private readonly id: StockItemId,
    private readonly quantity: Quantity,
    private readonly reservationId: string,
    private readonly releaseReason?: string,
  ) {
    super(params); // call base DomainEvent constructor
  }

  /** Returns the event name */
  public eventName(): string {
    return 'inventory.stock_item.reservation_released';
  }

  /** Returns the stock item ID */
  get stockItemId(): string {
    return this.id.value;
  }

  /** Returns the released quantity */
  get releasedQuantity(): number {
    return this.quantity.value;
  }

  /** Returns the reservation ID */
  get reservationIdentifier(): string {
    return this.reservationId;
  }

  /** Returns the release reason */
  get reason(): string | undefined {
    return this.releaseReason;
  }

  /** Returns the payload to be serialized when the event is published */
  protected toPayload(): StockItemReservationReleasedPayload {
    return {
      stockItemId: this.id.value,
      releasedQuantity: this.quantity.value,
      reservationIdentifier: this.reservationId,
      ...(this.releaseReason && { reason: this.releaseReason }),
    };
  }

  /**
   * Static factory method to create from primitives
   *
   * @param primitives - serialized event data
   * @returns new StockItemReservationReleased instance
   */
  static fromPrimitives(primitives: DomainEventPrimitives): StockItemReservationReleased {
    // Handle both direct payload format and nested attributes format
    const payload = (primitives as DomainEventPrimitives & { attributes?: unknown }).attributes || primitives;

    // Map RabbitMQ message structure to DomainEventPrimitives structure
    const eventPrimitives: DomainEventPrimitives = {
      aggregateId: primitives.aggregateId,
      eventId: (primitives as DomainEventPrimitives & { id?: string }).id || primitives.eventId,
      occurredOn: primitives.occurredOn,
      eventName: (primitives as DomainEventPrimitives & { type?: string }).type || primitives.eventName,
      eventVersion: (payload as DomainEventPrimitives & { eventVersion?: string }).eventVersion,
      ...payload,
    };

    // Validate required payload fields before creating value objects
    if (!eventPrimitives.stockItemId) {
      throw new Error('Missing stockItemId in event attributes');
    }
    if (eventPrimitives.releasedQuantity === undefined || eventPrimitives.releasedQuantity === null) {
      throw new Error('Missing releasedQuantity in event attributes');
    }
    if (!eventPrimitives.reservationIdentifier) {
      throw new Error('Missing reservationIdentifier in event attributes');
    }

    return new StockItemReservationReleased(
      {
        aggregateId: StockItemId.from(eventPrimitives.aggregateId),
        eventId: Uuid.from(eventPrimitives.eventId),
        occurredOn: new Date(eventPrimitives.occurredOn),
      },
      StockItemId.from(eventPrimitives.stockItemId as string),
      Quantity.from(eventPrimitives.releasedQuantity as number),
      eventPrimitives.reservationIdentifier as string,
      eventPrimitives.reason as string | undefined,
    );
  }
}

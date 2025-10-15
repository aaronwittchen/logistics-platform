import { DomainEvent, DomainEventPrimitives } from '@/Shared/domain/DomainEvent';
import { Uuid } from '@/Shared/domain/Uuid';
import { StockItemId } from '../StockItemId';
import { Quantity } from '../Quantity';

/**
 * Payload shape for the StockItemReserved event.
 *
 * Defines the data that will be serialized when the event is published.
 */
export interface StockItemReservedPayload {
  stockItemId: string; // stock item ID
  reservedQuantity: number; // reserved quantity
  reservationIdentifier: string; // unique reservation identifier
}

/**
 * StockItemReserved
 *
 * A domain event representing the reservation of stock items from inventory.
 *
 * Responsibilities:
 * - Capture the relevant state when stock is reserved
 * - Provide serialization for event publishing
 * - Enable tracking of inventory reservations
 */
export class StockItemReserved extends DomainEvent<StockItemReservedPayload> {
  /** Static event name for this domain event */
  static EVENT_NAME = 'inventory.stock_item.reserved';

  /**
   * Constructor
   *
   * @param params - metadata for the domain event (aggregateId, optional eventId, optional timestamp)
   * @param id - the StockItemId of the reserved item
   * @param quantity - the Quantity being reserved
   * @param reservationId - unique identifier for this reservation
   */
  constructor(
    params: { aggregateId: StockItemId; eventId?: Uuid; occurredOn?: Date },
    private readonly id: StockItemId,
    private readonly quantity: Quantity,
    private readonly reservationId: string,
  ) {
    super(params); // call base DomainEvent constructor
  }

  /** Returns the event name */
  public eventName(): string {
    return 'inventory.stock_item.reserved';
  }

  /** Returns the stock item ID */
  get stockItemId(): string {
    return this.id.value;
  }

  /** Returns the reserved quantity */
  get reservedQuantity(): number {
    return this.quantity.value;
  }

  /** Returns the reservation ID */
  get reservationIdentifier(): string {
    return this.reservationId;
  }

  /** Returns the payload to be serialized when the event is published */
  /** Returns the payload to be serialized when the event is published */
  protected toPayload(): StockItemReservedPayload {
    return {
      stockItemId: this.id.value,
      reservedQuantity: this.quantity.value,
      reservationIdentifier: this.reservationId,
    };
  }

  /**
   * Static factory method to create from primitives
   *
   * @param primitives - serialized event data
   * @returns new StockItemReserved instance
   */
  static fromPrimitives(primitives: DomainEventPrimitives): StockItemReserved {
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

    return new StockItemReserved(
      {
        aggregateId: StockItemId.from(eventPrimitives.aggregateId),
        eventId: Uuid.from(eventPrimitives.eventId),
        occurredOn: new Date(eventPrimitives.occurredOn),
      },
      StockItemId.from(eventPrimitives.stockItemId as string),
      Quantity.from(eventPrimitives.reservedQuantity as number),
      eventPrimitives.reservationIdentifier as string,
    );
  }
}

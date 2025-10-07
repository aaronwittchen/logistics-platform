import { DomainEvent } from '@/Shared/domain/DomainEvent';
import { Uuid } from '@/Shared/domain/Uuid';
import { StockItemId } from '../StockItemId';
import { Quantity } from '../Quantity';

/**
 * Payload shape for the StockItemReserved event.
 *
 * Defines the data that will be serialized when the event is published.
 */
export interface StockItemReservedPayload {
  stockItemId: string;           // stock item ID
  reservedQuantity: number;     // reserved quantity
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
    private readonly reservationId: string
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
   * @param params - serialized event data
   * @returns new StockItemReserved instance
   */
  static fromPrimitives(params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: { id: string; quantity: number; reservationId: string };
  }): StockItemReserved {
    return new StockItemReserved(
      {
        aggregateId: StockItemId.from(params.aggregateId),
        eventId: Uuid.from(params.eventId),
        occurredOn: params.occurredOn
      },
      StockItemId.from(params.attributes.id),
      Quantity.from(params.attributes.quantity),
      params.attributes.reservationId
    );
  }
}
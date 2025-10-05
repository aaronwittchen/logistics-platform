import { DomainEvent } from "@/Shared/domain/DomainEvent";
import { Uuid } from "@/Shared/domain/Uuid";
import { StockItemId } from "../StockItemId";
import { StockItemName } from "../StockItemName";
import { Quantity } from "../Quantity";

/**
 * Payload shape for the StockItemAdded event.
 *
 * Defines the data that will be serialized when the event is published.
 */
export interface StockItemAddedPayload {
  name: string;       // stock item name
  quantity: number;   // stock item quantity
}

/**
 * StockItemAdded
 *
 * A domain event representing the addition of a stock item to inventory.
 *
 * Responsibilities:
 * - Capture the relevant state when a stock item is added
 * - Provide serialization for event publishing
 */
export class StockItemAdded extends DomainEvent<StockItemAddedPayload> {
  /**
   * Constructor
   *
   * @param params - metadata for the domain event (aggregateId, optional eventId, optional timestamp)
   * @param name - the StockItemName value object
   * @param quantity - the Quantity value object
   */
  constructor(
    params: { aggregateId: StockItemId; eventId?: Uuid; occurredOn?: Date },
    private readonly name: StockItemName,
    private readonly quantity: Quantity
  ) {
    super(params); // call base DomainEvent constructor
  }

  /** Returns the event name */
  public eventName(): string {
    return "inventory.stock_item.added";
  }

  /** Returns the payload to be serialized when the event is published */
  protected toPayload(): StockItemAddedPayload {
    return {
      name: this.name.value,
      quantity: this.quantity.value,
    };
  }
}

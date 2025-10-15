import { DomainEvent, DomainEventPrimitives } from '@/Shared/domain/DomainEvent';
import { Uuid } from '@/Shared/domain/Uuid';
import { StockItemId } from '../StockItemId';
import { StockItemName } from '../StockItemName';
import { Quantity } from '../Quantity';

/**
 * Payload shape for the StockItemAdded event.
 *
 * Defines the data that will be serialized when the event is published.
 */
export interface StockItemAddedPayload {
  name: string; // stock item name
  quantity: number; // stock item quantity
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
  /** Static event name for this domain event */
  static EVENT_NAME = 'inventory.stock_item.added';

  /**
   * Constructor
   *
   * @param params - metadata for the domain event (aggregateId, optional eventId, optional timestamp)
   * @param name - the StockItemName value object
   * @param quantity - the Quantity value object
   */
  constructor(
    params: { aggregateId: Uuid; eventId?: Uuid; occurredOn?: Date },
    private readonly stockItemName: StockItemName,
    private readonly stockQuantity: Quantity,
  ) {
    super(params); // call base DomainEvent constructor
  }

  /** Returns the event name */
  public eventName(): string {
    return 'inventory.stock_item.added';
  }

  /** Returns the stock item name */
  get name(): string {
    return this.stockItemName.value;
  }

  /** Returns the stock item quantity */
  get quantity(): number {
    return this.stockQuantity.value;
  }

  /** Returns the payload to be serialized when the event is published */
  protected toPayload(): StockItemAddedPayload {
    return {
      name: this.stockItemName.value,
      quantity: this.stockQuantity.value,
    };
  }

  /**
   * Static factory method to create from primitives
   *
   * @param primitives - serialized event data
   * @returns new StockItemAdded instance
   */
  static fromPrimitives(primitives: DomainEventPrimitives): StockItemAdded {
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
    if (!eventPrimitives.name) {
      throw new Error('Missing name in event attributes');
    }
    if (eventPrimitives.quantity === undefined || eventPrimitives.quantity === null) {
      throw new Error('Missing quantity in event attributes');
    }

    return new StockItemAdded(
      {
        aggregateId: StockItemId.from(eventPrimitives.aggregateId),
        eventId: Uuid.from(eventPrimitives.eventId),
        occurredOn: new Date(eventPrimitives.occurredOn),
      },
      StockItemName.from(eventPrimitives.name as string),
      Quantity.from(eventPrimitives.quantity as number),
    );
  }
}

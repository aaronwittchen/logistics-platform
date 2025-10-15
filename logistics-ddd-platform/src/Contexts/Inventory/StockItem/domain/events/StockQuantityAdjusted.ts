import { DomainEvent, DomainEventPrimitives } from '@/Shared/domain/DomainEvent';
import { Uuid } from '@/Shared/domain/Uuid';
import { StockItemId } from '../StockItemId';
import { Quantity } from '../Quantity';

/**
 * Enumeration of adjustment types
 */
export type AdjustmentType = 'ADDITION' | 'REDUCTION' | 'CORRECTION';

/**
 * Payload shape for the StockQuantityAdjusted event.
 *
 * Defines the data that will be serialized when the event is published.
 */
export interface StockQuantityAdjustedPayload {
  stockItemId: string; // stock item ID
  originalQuantity: number; // quantity before adjustment
  newQuantity: number; // quantity after adjustment
  adjustmentQuantity: number; // the amount added or subtracted
  adjustmentType: AdjustmentType; // type of adjustment
  reason?: string; // optional reason for the adjustment
}

/**
 * StockQuantityAdjusted
 *
 * A domain event representing an adjustment to a stock item's quantity.
 *
 * Responsibilities:
 * - Capture the relevant state when stock quantity is adjusted
 * - Provide serialization for event publishing
 * - Enable tracking of inventory changes and audit trail
 */
export class StockQuantityAdjusted extends DomainEvent<StockQuantityAdjustedPayload> {
  /** Static event name for this domain event */
  static EVENT_NAME = 'inventory.stock_item.quantity_adjusted';

  /**
   * Constructor
   *
   * @param params - metadata for the domain event (aggregateId, optional eventId, optional timestamp)
   * @param id - the StockItemId of the item being adjusted
   * @param originalQuantity - quantity before adjustment
   * @param newQuantity - quantity after adjustment
   * @param adjustmentQuantity - the amount of change
   * @param adjustmentType - type of adjustment (ADDITION, REDUCTION, CORRECTION)
   * @param reason - optional reason for the adjustment
   */
  constructor(
    params: { aggregateId: Uuid; eventId?: Uuid; occurredOn?: Date },
    private readonly id: StockItemId,
    private readonly originalQuantityValue: Quantity,
    private readonly newQuantityValue: Quantity,
    private readonly adjustmentQuantityValue: Quantity,
    private readonly adjustmentTypeValue: AdjustmentType,
    private readonly reasonValue?: string,
  ) {
    super(params); // call base DomainEvent constructor

    // Validate business rules
    this.ensureValidAdjustment();
  }

  /** Returns the event name */
  public eventName(): string {
    return 'inventory.stock_item.quantity_adjusted';
  }

  /** Returns the stock item ID */
  get stockItemId(): string {
    return this.id.value;
  }

  /** Returns the original quantity before adjustment */
  get originalQuantity(): number {
    return this.originalQuantityValue.value;
  }

  /** Returns the new quantity after adjustment */
  get newQuantity(): number {
    return this.newQuantityValue.value;
  }

  /** Returns the adjustment quantity */
  get adjustmentQuantity(): number {
    return this.adjustmentQuantityValue.value;
  }

  /** Returns the adjustment type */
  get adjustmentType(): AdjustmentType {
    return this.adjustmentTypeValue;
  }

  /** Returns the adjustment reason */
  get reason(): string | undefined {
    return this.reasonValue;
  }

  /** Returns the payload to be serialized when the event is published */
  protected toPayload(): StockQuantityAdjustedPayload {
    return {
      stockItemId: this.id.value,
      originalQuantity: this.originalQuantityValue.value,
      newQuantity: this.newQuantityValue.value,
      adjustmentQuantity: this.adjustmentQuantityValue.value,
      adjustmentType: this.adjustmentTypeValue,
      ...(this.reasonValue && { reason: this.reasonValue }),
    };
  }

  /**
   * Static factory method to create from primitives
   *
   * @param primitives - serialized event data
   * @returns new StockQuantityAdjusted instance
   */
  static fromPrimitives(primitives: DomainEventPrimitives): StockQuantityAdjusted {
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
    if (eventPrimitives.originalQuantity === undefined || eventPrimitives.originalQuantity === null) {
      throw new Error('Missing originalQuantity in event attributes');
    }
    if (eventPrimitives.newQuantity === undefined || eventPrimitives.newQuantity === null) {
      throw new Error('Missing newQuantity in event attributes');
    }
    if (eventPrimitives.adjustmentQuantity === undefined || eventPrimitives.adjustmentQuantity === null) {
      throw new Error('Missing adjustmentQuantity in event attributes');
    }
    if (!eventPrimitives.adjustmentType) {
      throw new Error('Missing adjustmentType in event attributes');
    }

    // Validate adjustment type
    const validAdjustmentTypes: AdjustmentType[] = ['ADDITION', 'REDUCTION', 'CORRECTION'];
    if (!validAdjustmentTypes.includes(eventPrimitives.adjustmentType as AdjustmentType)) {
      throw new Error(`Invalid adjustmentType: ${eventPrimitives.adjustmentType}`);
    }

    return new StockQuantityAdjusted(
      {
        aggregateId: StockItemId.from(eventPrimitives.aggregateId),
        eventId: Uuid.from(eventPrimitives.eventId),
        occurredOn: new Date(eventPrimitives.occurredOn),
      },
      StockItemId.from(eventPrimitives.stockItemId as string),
      Quantity.from(eventPrimitives.originalQuantity as number),
      Quantity.from(eventPrimitives.newQuantity as number),
      Quantity.from(eventPrimitives.adjustmentQuantity as number),
      eventPrimitives.adjustmentType as AdjustmentType,
      eventPrimitives.reason as string | undefined,
    );
  }

  /**
   * Validate that the adjustment is mathematically consistent
   */
  private ensureValidAdjustment(): void {
    const expectedNewQuantity =
      this.adjustmentTypeValue === 'ADDITION'
        ? Quantity.from(this.originalQuantityValue.value + this.adjustmentQuantityValue.value)
        : Quantity.from(this.originalQuantityValue.value - this.adjustmentQuantityValue.value);

    if (!expectedNewQuantity.equals(this.newQuantityValue)) {
      throw new Error('Adjustment quantities are not mathematically consistent');
    }

    if (
      this.adjustmentTypeValue === 'REDUCTION' &&
      this.adjustmentQuantityValue.value > this.originalQuantityValue.value
    ) {
      throw new Error('Cannot reduce quantity below zero');
    }
  }
}

import { Uuid } from "./Uuid";

/**
 * Shape of a domain event when converted to plain JavaScript objects.
 *
 * Used for serialization, persistence, or messaging systems.
 */
export interface DomainEventPrimitives {
  aggregateId: string;   // ID of the aggregate that triggered the event
  eventId: string;       // Unique ID for this event instance
  occurredOn: string;    // ISO timestamp of when the event occurred
  eventName: string;     // Name/type of the event
  [key: string]: unknown; // Additional payload specific to each event
}

/**
 * Base abstract class for all domain events.
 *
 * Domain Events are immutable objects that describe something that happened in the system.
 *
 * @template TPayload - shape of the event-specific payload
 */
export abstract class DomainEvent<TPayload extends object = object> {
  public readonly aggregateId: Uuid; // ID of the aggregate the event relates to
  public readonly eventId: Uuid;     // Unique identifier for the event instance
  public readonly occurredOn: Date;  // Timestamp when the event was created

  /**
   * Constructor initializes the event with required and optional properties.
   *
   * @param params.aggregateId - aggregate that raised the event
   * @param params.eventId - optional unique ID for this event (auto-generated if missing)
   * @param params.occurredOn - optional timestamp (defaults to current time)
   */
  protected constructor(params: {
    aggregateId: Uuid;
    eventId?: Uuid;
    occurredOn?: Date;
  }) {
    this.aggregateId = params.aggregateId;
    this.eventId = params.eventId ?? Uuid.random();   // generate new ID if not provided
    this.occurredOn = params.occurredOn ?? new Date(); // default to now if not provided
    
    // Make properties truly immutable at runtime
    Object.defineProperty(this, 'aggregateId', {
      value: this.aggregateId,
      writable: false,
      configurable: false,
      enumerable: true
    });
    
    Object.defineProperty(this, 'eventId', {
      value: this.eventId,
      writable: false,
      configurable: false,
      enumerable: true
    });
    
    Object.defineProperty(this, 'occurredOn', {
      value: this.occurredOn,
      writable: false,
      configurable: false,
      enumerable: true
    });
  }

  /**
   * Every concrete event must provide a unique name.
   *
   * Used for identification, messaging, and event sourcing.
   */
  public abstract eventName(): string;

  /**
   * Compare two domain events for equality.
   *
   * Events are considered equal if they have the same aggregateId, eventName, and payload.
   */
  public equals(other: DomainEvent): boolean {
    if (!other) return false;
    if (!this.aggregateId.equals(other.aggregateId) || this.eventName() !== other.eventName()) {
      return false;
    }

    // Compare payloads using JSON serialization for deep equality
    const thisPayload = this.toPayload();
    const otherPayload = other.toPayload();

    return JSON.stringify(thisPayload) === JSON.stringify(otherPayload);
  }

  /**
   * Every concrete event must provide its specific payload.
   *
   * This is merged into the primitive representation when serializing.
   */
  protected abstract toPayload(): TPayload;

  /**
   * Convert the DomainEvent into a plain object suitable for:
   * - persistence in event stores
   * - serialization over messaging systems
   * - logging or debugging
   *
   * Includes:
   * - aggregateId
   * - eventId
   * - occurredOn (as ISO string)
   * - eventName
   * - concrete payload from `toPayload()`
   */
  public toPrimitives(): DomainEventPrimitives {
    return {
      aggregateId: this.aggregateId.value,
      eventId: this.eventId.value,
      occurredOn: this.occurredOn.toISOString(),
      eventName: this.eventName(),
      ...this.toPayload(), // merge event-specific payload
    } satisfies DomainEventPrimitives;
  }
}
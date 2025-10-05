import { describe, expect, test } from "bun:test";
import { DomainEvent } from "../src/Shared/domain/DomainEvent";
import { Uuid } from "../src/Shared/domain/Uuid";

/**
 * TestEvent
 *
 * A simple concrete DomainEvent for testing purposes.
 * - Payload contains a single property `foo`
 * - Implements required abstract methods: eventName() and toPayload()
 */
class TestEvent extends DomainEvent<{ foo: number }> {
  constructor(
    params: { aggregateId: Uuid; eventId?: Uuid; occurredOn?: Date },
    private readonly foo: number // event-specific payload
  ) {
    super(params); // call base DomainEvent constructor
  }

  /** Returns the name of the event */
  public eventName(): string {
    return "test.event";
  }

  /** Returns the event-specific payload */
  protected toPayload() {
    return { foo: this.foo };
  }
}

describe("DomainEvent", () => {
  // Test default values for eventId and occurredOn when not provided
  test("sets defaults for eventId and occurredOn", () => {
    const aggregateId = Uuid.random();
    const e = new TestEvent({ aggregateId }, 42);

    expect(e.aggregateId.value).toBe(aggregateId.value); // aggregateId is set
    expect(e.eventId.value).toMatch(/[0-9a-f-]{36}/i);   // random eventId is generated
    expect(e.occurredOn instanceof Date).toBe(true);     // timestamp defaults to now
  });

  // Test that providing eventId and occurredOn overrides defaults
  test("respects provided eventId and occurredOn", () => {
    const aggregateId = Uuid.random();
    const eventId = Uuid.random();
    const occurredOn = new Date("2024-01-01T00:00:00.000Z");
    const e = new TestEvent({ aggregateId, eventId, occurredOn }, 7);

    expect(e.eventId.value).toBe(eventId.value);                  // provided eventId is used
    expect(e.occurredOn.toISOString()).toBe(occurredOn.toISOString()); // provided timestamp is used
  });

  // Test serialization to plain object including payload
  test("toPrimitives returns serializable shape with payload", () => {
    const aggregateId = Uuid.from("6f9619ff-8b86-4d11-b42d-00c04fc964ff");
    const e = new TestEvent({ aggregateId }, 5);
    const p = e.toPrimitives();

    // Check metadata
    expect(p.aggregateId).toBe(aggregateId.value);
    expect(p.eventName).toBe("test.event");
    expect(typeof p.eventId).toBe("string");
    expect(typeof p.occurredOn).toBe("string");

    // Check payload
    expect(p).toMatchObject({ foo: 5 });
  });
});

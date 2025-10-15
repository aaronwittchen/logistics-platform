import { AggregateRoot } from '@/Shared/domain/AggregateRoot';
import { DomainEvent } from '@/Shared/domain/DomainEvent';
import { Uuid } from '@/Shared/domain/Uuid';

// Simple test domain event for testing AggregateRoot
class TestDomainEvent extends DomainEvent {
  static EVENT_NAME = 'test.aggregate.event';

  constructor(
    aggregateId: Uuid,
    public readonly message: string,
    eventId?: Uuid,
    occurredOn?: Date,
  ) {
    super({ aggregateId, eventId, occurredOn });
  }

  public eventName(): string {
    return TestDomainEvent.EVENT_NAME;
  }

  protected toPayload(): { message: string } {
    return { message: this.message };
  }
}

// Another test domain event for multiple events testing
class AnotherTestDomainEvent extends DomainEvent {
  static EVENT_NAME = 'another.test.event';

  constructor(
    aggregateId: Uuid,
    public readonly data: number,
    eventId?: Uuid,
    occurredOn?: Date,
  ) {
    super({ aggregateId, eventId, occurredOn });
  }

  public eventName(): string {
    return AnotherTestDomainEvent.EVENT_NAME;
  }

  protected toPayload(): { data: number } {
    return { data: this.data };
  }
}

// Test aggregate root implementation
class TestAggregate extends AggregateRoot {
  private id: Uuid;
  private message: string = '';

  constructor(id: string) {
    super();
    this.id = Uuid.from(id);
  }

  public getId(): Uuid {
    return this.id;
  }

  public getMessage(): string {
    return this.message;
  }

  public doSomething(message: string): void {
    this.message = message;
    this.record(new TestDomainEvent(this.id, message));
  }

  public doSomethingElse(data: number): void {
    this.record(new AnotherTestDomainEvent(this.id, data));
  }

  public doMultipleThings(message1: string, message2: string): void {
    this.record(new TestDomainEvent(this.id, message1));
    this.record(new AnotherTestDomainEvent(this.id, 42));
    this.record(new TestDomainEvent(this.id, message2));
  }

  public toPrimitives(): { id: string; message: string } {
    return { id: this.id.value, message: this.message };
  }

  public recordCustomEvent(event: DomainEvent): void {
    this.record(event);
  }
}

describe('AggregateRoot', () => {
  describe('domain event recording', () => {
    it('should record a single domain event', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');
      aggregate.doSomething('test message');

      const events = aggregate.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TestDomainEvent);
      expect(events[0].aggregateId).toBe(aggregate.getId());
      expect((events[0] as TestDomainEvent).message).toBe('test message');
    });

    it('should record multiple domain events', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');
      aggregate.doSomething('first message');
      aggregate.doSomethingElse(42);
      aggregate.doSomething('second message');

      const events = aggregate.pullDomainEvents();
      expect(events).toHaveLength(3);

      expect(events[0]).toBeInstanceOf(TestDomainEvent);
      expect(events[1]).toBeInstanceOf(AnotherTestDomainEvent);
      expect(events[2]).toBeInstanceOf(TestDomainEvent);

      expect((events[0] as TestDomainEvent).message).toBe('first message');
      expect((events[1] as AnotherTestDomainEvent).data).toBe(42);
      expect((events[2] as TestDomainEvent).message).toBe('second message');
    });

    it('should record events in the correct order', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');
      aggregate.doMultipleThings('message 1', 'message 3');

      const events = aggregate.pullDomainEvents();
      expect(events).toHaveLength(3);

      expect(events[0]).toBeInstanceOf(TestDomainEvent);
      expect(events[1]).toBeInstanceOf(AnotherTestDomainEvent);
      expect(events[2]).toBeInstanceOf(TestDomainEvent);

      expect((events[0] as TestDomainEvent).message).toBe('message 1');
      expect((events[1] as AnotherTestDomainEvent).data).toBe(42);
      expect((events[2] as TestDomainEvent).message).toBe('message 3');
    });

    it('should record events with different aggregate IDs', () => {
      const aggregate1 = new TestAggregate('660e8400-e29b-41d4-a716-446655440000');
      const aggregate2 = new TestAggregate('770e8400-e29b-41d4-a716-446655440000');

      aggregate1.doSomething('message from aggregate 1');
      aggregate2.doSomething('message from aggregate 2');

      const events1 = aggregate1.pullDomainEvents();
      const events2 = aggregate2.pullDomainEvents();

      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(1);

      expect(events1[0].aggregateId.value).toBe('660e8400-e29b-41d4-a716-446655440000');
      expect(events2[0].aggregateId.value).toBe('770e8400-e29b-41d4-a716-446655440000');

      expect((events1[0] as TestDomainEvent).message).toBe('message from aggregate 1');
      expect((events2[0] as TestDomainEvent).message).toBe('message from aggregate 2');
    });
  });

  describe('pullDomainEvents behavior', () => {
    it('should return all recorded events and clear the internal list', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');
      aggregate.doSomething('first message');
      aggregate.doSomethingElse(42);

      // First pull
      const events1 = aggregate.pullDomainEvents();
      expect(events1).toHaveLength(2);

      // Second pull should return empty array
      const events2 = aggregate.pullDomainEvents();
      expect(events2).toHaveLength(0);
    });

    it('should return a new array each time (not a reference)', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');
      aggregate.doSomething('test message');

      const events1 = aggregate.pullDomainEvents();
      const events2 = aggregate.pullDomainEvents();

      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(0);

      // events1 should still contain the event
      expect(events1[0]).toBeDefined();

      // Adding a new event should work independently
      aggregate.doSomething('another message');
      const events3 = aggregate.pullDomainEvents();
      expect(events3).toHaveLength(1);
      expect((events3[0] as TestDomainEvent).message).toBe('another message');
    });

    it('should handle pulling events when none are recorded', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');

      const events = aggregate.pullDomainEvents();
      expect(events).toHaveLength(0);

      // Should be able to record events after pulling empty list
      aggregate.doSomething('test message');
      const eventsAfter = aggregate.pullDomainEvents();
      expect(eventsAfter).toHaveLength(1);
    });
  });

  describe('event properties', () => {
    it('should generate unique event IDs for each recorded event', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');
      aggregate.doSomething('message 1');
      aggregate.doSomething('message 2');

      const events = aggregate.pullDomainEvents();
      expect(events).toHaveLength(2);

      expect(events[0].eventId.value).not.toBe(events[1].eventId.value);
      expect(events[0].eventId.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(events[1].eventId.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should set occurredOn timestamp for each event', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');
      const beforeRecording = new Date();

      aggregate.doSomething('test message');

      const afterRecording = new Date();
      const events = aggregate.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0].occurredOn).toBeInstanceOf(Date);
      expect(events[0].occurredOn.getTime()).toBeGreaterThanOrEqual(beforeRecording.getTime());
      expect(events[0].occurredOn.getTime()).toBeLessThanOrEqual(afterRecording.getTime());
    });

    it('should handle events recorded at nearly the same time', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');

      // Record multiple events in quick succession
      aggregate.doSomething('message 1');
      aggregate.doSomething('message 2');
      aggregate.doSomething('message 3');

      const events = aggregate.pullDomainEvents();
      expect(events).toHaveLength(3);

      // All events should have timestamps, but they might be the same millisecond
      events.forEach(event => {
        expect(event.occurredOn).toBeInstanceOf(Date);
      });
    });

    it('should allow custom event ID and timestamp when provided', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');
      const customEventId = Uuid.random();
      const customTimestamp = new Date('2023-01-01T12:00:00.000Z');

      // We need to modify our test domain event to accept custom eventId and occurredOn
      // For this test, let's create a simple event that uses the base constructor
      const customEvent = new TestDomainEvent(aggregate.getId(), 'custom message', customEventId, customTimestamp);

      aggregate.recordCustomEvent(customEvent);
      const events = aggregate.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventId).toBe(customEventId);
      expect(events[0].occurredOn).toBe(customTimestamp);
    });
  });

  describe('integration with domain events', () => {
    it('should work with events that have complex payloads', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');

      // Record events with different payload types
      aggregate.doSomething('string message');
      aggregate.doSomethingElse(42);

      const events = aggregate.pullDomainEvents();
      expect(events).toHaveLength(2);

      // Verify the payloads through toPrimitives
      const primitives1 = events[0].toPrimitives();
      const primitives2 = events[1].toPrimitives();

      expect(primitives1.message).toBe('string message');
      expect(primitives2.data).toBe(42);
    });

    it('should maintain event order in toPrimitives serialization', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');

      aggregate.doSomething('first');
      aggregate.doSomethingElse(1);
      aggregate.doSomething('second');

      const events = aggregate.pullDomainEvents();
      const primitives = events.map(event => event.toPrimitives());

      expect(primitives).toHaveLength(3);
      expect(primitives[0].eventName).toBe('test.aggregate.event');
      expect(primitives[1].eventName).toBe('another.test.event');
      expect(primitives[2].eventName).toBe('test.aggregate.event');

      expect(primitives[0].message).toBe('first');
      expect(primitives[1].data).toBe(1);
      expect(primitives[2].message).toBe('second');
    });
  });

  describe('edge cases', () => {
    it('should handle recording many events', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');
      const numberOfEvents = 1000;

      for (let i = 0; i < numberOfEvents; i++) {
        aggregate.doSomething(`message ${i}`);
      }

      const events = aggregate.pullDomainEvents();
      expect(events).toHaveLength(numberOfEvents);

      // Verify all events have unique IDs
      const eventIds = events.map(event => event.eventId.value);
      const uniqueEventIds = new Set(eventIds);
      expect(uniqueEventIds.size).toBe(numberOfEvents);
    });

    it('should handle concurrent-like operations correctly', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');

      // Simulate concurrent-like operations
      aggregate.doSomething('message 1');
      const events1 = aggregate.pullDomainEvents();

      aggregate.doSomething('message 2');
      aggregate.doSomething('message 3');
      const events2 = aggregate.pullDomainEvents();

      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(2);

      expect((events1[0] as TestDomainEvent).message).toBe('message 1');
      expect((events2[0] as TestDomainEvent).message).toBe('message 2');
      expect((events2[1] as TestDomainEvent).message).toBe('message 3');
    });

    it('should handle empty aggregate state correctly', () => {
      const aggregate = new TestAggregate('550e8400-e29b-41d4-a716-446655440000');

      // Pull events from fresh aggregate
      const events1 = aggregate.pullDomainEvents();
      expect(events1).toHaveLength(0);

      // Pull again
      const events2 = aggregate.pullDomainEvents();
      expect(events2).toHaveLength(0);

      // Should still be able to record events
      aggregate.doSomething('test message');
      const events3 = aggregate.pullDomainEvents();
      expect(events3).toHaveLength(1);
    });
  });
});

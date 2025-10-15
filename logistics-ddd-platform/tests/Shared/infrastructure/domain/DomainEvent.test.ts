import { DomainEvent, DomainEventPrimitives } from '@/Shared/domain/DomainEvent';
import { Uuid } from '@/Shared/domain/Uuid';

// Test implementation of DomainEvent for testing purposes
interface TestPayload {
  testData: string;
  testNumber: number;
}

class TestDomainEvent extends DomainEvent<TestPayload> {
  public static EVENT_NAME = 'test.domain.event';

  constructor(
    aggregateId: Uuid,
    testData: string = 'default',
    testNumber: number = 0,
    eventId?: Uuid,
    occurredOn?: Date,
  ) {
    super({ aggregateId, eventId, occurredOn });
    this.testData = testData;
    this.testNumber = testNumber;
  }

  public eventName(): string {
    return TestDomainEvent.EVENT_NAME;
  }

  protected toPayload(): TestPayload {
    return {
      testData: this.testData,
      testNumber: this.testNumber,
    };
  }

  // Store additional data for testing
  private testData: string;
  private testNumber: number;
}

// Another test event for testing different scenarios
class AnotherTestDomainEvent extends DomainEvent<{ message: string }> {
  public static EVENT_NAME = 'another.test.event';

  constructor(aggregateId: Uuid, message: string, eventId?: Uuid, occurredOn?: Date) {
    super({ aggregateId, eventId, occurredOn });
    this.message = message;
  }

  public eventName(): string {
    return AnotherTestDomainEvent.EVENT_NAME;
  }

  protected toPayload(): { message: string } {
    return {
      message: this.message,
    };
  }

  private message: string;
}

describe('DomainEvent', () => {
  describe('constructor', () => {
    it('should create event with all parameters provided', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const eventId = new Uuid('660e8400-e29b-41d4-a716-446655440000');
      const occurredOn = new Date('2023-01-01T12:00:00.000Z');

      const event = new TestDomainEvent(aggregateId, 'test data', 42, eventId, occurredOn);

      expect(event.aggregateId).toBe(aggregateId);
      expect(event.eventId).toBe(eventId);
      expect(event.occurredOn).toBe(occurredOn);
    });

    it('should generate eventId when not provided', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const occurredOn = new Date('2023-01-01T12:00:00.000Z');

      const event = new TestDomainEvent(aggregateId, 'test', 42, undefined, occurredOn);

      expect(event.eventId).toBeDefined();
      expect(event.eventId.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(event.aggregateId).toBe(aggregateId);
      expect(event.occurredOn).toBe(occurredOn);
    });

    it('should generate occurredOn when not provided', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const eventId = new Uuid('660e8400-e29b-41d4-a716-446655440000');
      const beforeCreation = new Date();

      const event = new TestDomainEvent(aggregateId, 'test', 42, eventId);

      const afterCreation = new Date();
      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(event.occurredOn.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should generate both eventId and occurredOn when not provided', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const beforeCreation = new Date();

      const event = new TestDomainEvent(aggregateId);

      const afterCreation = new Date();
      expect(event.eventId).toBeDefined();
      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(event.occurredOn.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('abstract methods', () => {
    it('should implement eventName method', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const event = new TestDomainEvent(aggregateId);

      expect(event.eventName()).toBe('test.domain.event');
    });

    it('should implement toPayload method', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const event = new TestDomainEvent(aggregateId, 'custom data', 123);

      const payload = (event as any).toPayload();
      expect(payload).toEqual({
        testData: 'custom data',
        testNumber: 123,
      });
    });

    it('should handle different event types with different payloads', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const event = new AnotherTestDomainEvent(aggregateId, 'hello world');

      expect(event.eventName()).toBe('another.test.event');
      const payload = (event as any).toPayload();
      expect(payload).toEqual({
        message: 'hello world',
      });
    });
  });

  describe('toPrimitives serialization', () => {
    it('should convert to primitives with all required fields', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const eventId = new Uuid('660e8400-e29b-41d4-a716-446655440000');
      const occurredOn = new Date('2023-01-01T12:00:00.000Z');

      const event = new TestDomainEvent(aggregateId, 'test data', 42, eventId, occurredOn);

      const primitives = event.toPrimitives();

      expect(primitives).toEqual({
        aggregateId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: '660e8400-e29b-41d4-a716-446655440000',
        occurredOn: '2023-01-01T12:00:00.000Z',
        eventName: 'test.domain.event',
        eventVersion: '1.0.0',
        testData: 'test data',
        testNumber: 42,
      } satisfies DomainEventPrimitives);
    });

    it('should handle generated timestamps correctly', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const event = new TestDomainEvent(aggregateId);

      const primitives = event.toPrimitives();

      expect(primitives.occurredOn).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(primitives.occurredOn).toISOString()).toBe(primitives.occurredOn);
    });

    it('should merge payload with base properties correctly', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const event = new AnotherTestDomainEvent(aggregateId, 'test message');

      const primitives = event.toPrimitives();

      expect(primitives).toEqual({
        aggregateId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: expect.any(String),
        occurredOn: expect.any(String),
        eventName: 'another.test.event',
        eventVersion: '1.0.0',
        message: 'test message',
      } satisfies DomainEventPrimitives);
    });

    it('should handle empty payloads', () => {
      // Create a test event with empty payload
      class EmptyPayloadEvent extends DomainEvent<{}> {
        public static EVENT_NAME = 'empty.payload.event';

        constructor(aggregateId: Uuid, eventId?: Uuid, occurredOn?: Date) {
          super({ aggregateId, eventId, occurredOn });
        }

        public eventName(): string {
          return EmptyPayloadEvent.EVENT_NAME;
        }

        protected toPayload(): {} {
          return {};
        }
      }

      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const event = new EmptyPayloadEvent(aggregateId);

      const primitives = event.toPrimitives();

      expect(primitives).toEqual({
        aggregateId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: expect.any(String),
        occurredOn: expect.any(String),
        eventName: 'empty.payload.event',
        eventVersion: '1.0.0',
      } satisfies DomainEventPrimitives);
    });
  });

  describe('immutability', () => {
    it('should have immutable properties', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const eventId = new Uuid('660e8400-e29b-41d4-a716-446655440000');
      const occurredOn = new Date('2023-01-01T12:00:00.000Z');

      const event = new TestDomainEvent(aggregateId, 'test', 42, eventId, occurredOn);

      // Properties should be readonly (TypeScript level)
      expect(() => {
        (event as any).aggregateId = new Uuid('different-id');
      }).toThrow();

      expect(() => {
        (event as any).eventId = new Uuid('different-event-id');
      }).toThrow();

      expect(() => {
        (event as any).occurredOn = new Date();
      }).toThrow();
    });

    it('should maintain immutability of nested Uuid objects', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const event = new TestDomainEvent(aggregateId);

      // Uuid objects should be frozen (from ValueObject)
      expect(Object.isFrozen(event.aggregateId.unwrap())).toBe(true);
      expect(Object.isFrozen(event.eventId.unwrap())).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle events with special characters in payload', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const event = new TestDomainEvent(aggregateId, 'special chars: äöüß€', 999);

      const primitives = event.toPrimitives();
      expect(primitives.testData).toBe('special chars: äöüß€');
      expect(primitives.testNumber).toBe(999);
    });

    it('should handle very large numbers in payload', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const largeNumber = Number.MAX_SAFE_INTEGER;
      const event = new TestDomainEvent(aggregateId, 'test', largeNumber);

      const primitives = event.toPrimitives();
      expect(primitives.testNumber).toBe(largeNumber);
    });

    it('should handle events created at exact same time', () => {
      const aggregateId = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const now = new Date();

      const event1 = new TestDomainEvent(aggregateId, 'test1', 1, undefined, now);
      const event2 = new TestDomainEvent(aggregateId, 'test2', 2, undefined, now);

      expect(event1.occurredOn).toBe(event2.occurredOn);
      expect(event1.eventId.value).not.toBe(event2.eventId.value); // Different event IDs
    });
  });
});

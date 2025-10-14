import { StockItemAdded, StockItemAddedPayload } from '@/Contexts/Inventory/StockItem/domain/events/StockItemAdded';
import { DomainEventPrimitives } from '@/Shared/domain/DomainEvent';
import { StockItemId } from '@/Contexts/Inventory/StockItem/domain/StockItemId';
import { StockItemName } from '@/Contexts/Inventory/StockItem/domain/StockItemName';
import { Quantity } from '@/Contexts/Inventory/StockItem/domain/Quantity';
import { Uuid } from '@/Shared/domain/Uuid';

describe('StockItemAdded', () => {
  describe('constructor', () => {
    it('should create event with required parameters', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('iPhone 15');
      const stockQuantity = new Quantity(10);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe(aggregateId);
      expect(event.eventName()).toBe('inventory.stock_item.added');
      expect(event.name).toBe('iPhone 15');
      expect(event.quantity).toBe(10);
    });

    it('should create event with custom eventId and occurredOn', () => {
      const aggregateId = StockItemId.random();
      const customEventId = Uuid.random();
      const customTimestamp = new Date('2023-01-01T12:00:00.000Z');
      const stockItemName = StockItemName.from('iPhone 15');
      const stockQuantity = new Quantity(10);

      const event = new StockItemAdded(
        { aggregateId, eventId: customEventId, occurredOn: customTimestamp },
        stockItemName,
        stockQuantity
      );

      expect(event.eventId).toBe(customEventId);
      expect(event.occurredOn).toBe(customTimestamp);
      expect(event.name).toBe('iPhone 15');
      expect(event.quantity).toBe(10);
    });

    it('should generate eventId and occurredOn when not provided', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('iPhone 15');
      const stockQuantity = new Quantity(10);
      const beforeCreation = new Date();

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      const afterCreation = new Date();
      expect(event.eventId).toBeDefined();
      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(event.occurredOn.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('event properties', () => {
    it('should return correct event name', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('Samsung Galaxy');
      const stockQuantity = new Quantity(5);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      expect(event.eventName()).toBe('inventory.stock_item.added');
    });

    it('should return correct stock item name', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('MacBook Pro');
      const stockQuantity = new Quantity(3);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      expect(event.name).toBe('MacBook Pro');
    });

    it('should return correct quantity', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('iPad');
      const stockQuantity = new Quantity(20);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      expect(event.quantity).toBe(20);
    });

    it('should handle different stock item names', () => {
      const aggregateId = StockItemId.random();

      const testCases = [
        'iPhone 15',
        'Samsung Galaxy S24',
        'MacBook Pro 16"',
        'iPad Air',
        'Apple Watch Series 9'
      ];

      testCases.forEach(name => {
        const stockItemName = StockItemName.from(name);
        const stockQuantity = new Quantity(1);

        const event = new StockItemAdded(
          { aggregateId },
          stockItemName,
          stockQuantity
        );

        expect(event.name).toBe(name);
      });
    });

    it('should handle different quantities', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('Test Item');

      const quantities = [0, 1, 10, 100, 1000, 1000000];

      quantities.forEach(quantity => {
        const stockQuantity = new Quantity(quantity);

        const event = new StockItemAdded(
          { aggregateId },
          stockItemName,
          stockQuantity
        );

        expect(event.quantity).toBe(quantity);
      });
    });
  });

  describe('payload serialization', () => {
    it('should return correct payload through toPayload method', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('iPhone 15');
      const stockQuantity = new Quantity(10);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      const payload = (event as any).toPayload();
      expect(payload).toEqual({
        name: 'iPhone 15',
        quantity: 10,
      } satisfies StockItemAddedPayload);
    });

    it('should serialize to primitives correctly', () => {
      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const eventId = Uuid.from('660e8400-e29b-41d4-a716-446655440000');
      const occurredOn = new Date('2023-01-01T12:00:00.000Z');
      const stockItemName = StockItemName.from('iPhone 15');
      const stockQuantity = new Quantity(10);

      const event = new StockItemAdded(
        { aggregateId, eventId, occurredOn },
        stockItemName,
        stockQuantity
      );

      const primitives = event.toPrimitives();

      expect(primitives).toEqual({
        aggregateId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: '660e8400-e29b-41d4-a716-446655440000',
        occurredOn: '2023-01-01T12:00:00.000Z',
        eventName: 'inventory.stock_item.added',
        eventVersion: '1.0.0',
        name: 'iPhone 15',
        quantity: 10,
      } satisfies DomainEventPrimitives);
    });

    it('should handle events with generated timestamps in serialization', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('Test Item');
      const stockQuantity = new Quantity(5);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      const primitives = event.toPrimitives();

      expect(primitives.occurredOn).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(primitives.occurredOn).toISOString()).toBe(primitives.occurredOn);
      expect(primitives.name).toBe('Test Item');
      expect(primitives.quantity).toBe(5);
    });

    it('should include all required fields in primitives', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('Test Item');
      const stockQuantity = new Quantity(1);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      const primitives = event.toPrimitives();

      expect(primitives).toHaveProperty('aggregateId');
      expect(primitives).toHaveProperty('eventId');
      expect(primitives).toHaveProperty('occurredOn');
      expect(primitives).toHaveProperty('eventName');
      expect(primitives).toHaveProperty('name');
      expect(primitives).toHaveProperty('quantity');

      expect(primitives.eventName).toBe('inventory.stock_item.added');
      expect(primitives.name).toBe('Test Item');
      expect(primitives.quantity).toBe(1);
    });
  });

  describe('equality comparison (inherited from DomainEvent)', () => {
    it('should be equal to event with same aggregateId and payload', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('iPhone 15');
      const stockQuantity = new Quantity(10);

      const event1 = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      const event2 = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      expect(event1.equals(event2)).toBe(true);
    });

    it('should not be equal to event with different aggregateId', () => {
      const stockItemName = StockItemName.from('iPhone 15');
      const stockQuantity = new Quantity(10);

      const event1 = new StockItemAdded(
        { aggregateId: StockItemId.random() },
        stockItemName,
        stockQuantity
      );

      const event2 = new StockItemAdded(
        { aggregateId: StockItemId.random() },
        stockItemName,
        stockQuantity
      );

      expect(event1.equals(event2)).toBe(false);
    });

    it('should not be equal to event with different name', () => {
      const aggregateId = StockItemId.random();
      const stockQuantity = new Quantity(10);

      const event1 = new StockItemAdded(
        { aggregateId },
        StockItemName.from('iPhone 15'),
        stockQuantity
      );

      const event2 = new StockItemAdded(
        { aggregateId },
        StockItemName.from('Samsung Galaxy'),
        stockQuantity
      );

      expect(event1.equals(event2)).toBe(false);
    });

    it('should not be equal to event with different quantity', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('iPhone 15');

      const event1 = new StockItemAdded(
        { aggregateId },
        stockItemName,
        new Quantity(10)
      );

      const event2 = new StockItemAdded(
        { aggregateId },
        stockItemName,
        new Quantity(20)
      );

      expect(event1.equals(event2)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('iPhone 15');
      const stockQuantity = new Quantity(10);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      expect(event.equals(null as any)).toBe(false);
      expect(event.equals(undefined as any)).toBe(false);
    });

    it('should be equal to itself', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('iPhone 15');
      const stockQuantity = new Quantity(10);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      expect(event.equals(event)).toBe(true);
    });
  });

  describe('immutability (inherited from DomainEvent)', () => {
    it('should have immutable properties', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('iPhone 15');
      const stockQuantity = new Quantity(10);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      // Properties should be readonly (TypeScript level)
      expect(() => {
        (event as any).aggregateId = StockItemId.random();
      }).toThrow();

      expect(() => {
        (event as any).eventId = Uuid.random();
      }).toThrow();

      expect(() => {
        (event as any).occurredOn = new Date();
      }).toThrow();
    });

    it('should maintain immutability of nested value objects', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('iPhone 15');
      const stockQuantity = new Quantity(10);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      // Value objects should be frozen (from ValueObject)
      expect(Object.isFrozen(event.aggregateId.unwrap())).toBe(true);
      expect(Object.isFrozen(stockItemName.unwrap())).toBe(true);
      expect(Object.isFrozen(stockQuantity.unwrap())).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in stock item names', () => {
      const aggregateId = StockItemId.random();
      const stockQuantity = new Quantity(1);

      const specialNames = [
        'iPhone 15 Pro Max',
        'Samsung Galaxy S24 Ultra',
        'MacBook Pro 16" M3',
        'iPad Pro 12.9"',
        'Apple Watch Series 9 (45mm)',
        'AirPods Pro (2nd generation)'
      ];

      specialNames.forEach(name => {
        const stockItemName = StockItemName.from(name);

        const event = new StockItemAdded(
          { aggregateId },
          stockItemName,
          stockQuantity
        );

        expect(event.name).toBe(name);
      });
    });

    it('should handle large quantities', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('Bulk Item');

      const largeQuantities = [1000, 10000, 100000, 1000000];

      largeQuantities.forEach(quantity => {
        const stockQuantity = new Quantity(quantity);

        const event = new StockItemAdded(
          { aggregateId },
          stockItemName,
          stockQuantity
        );

        expect(event.quantity).toBe(quantity);
      });
    });

    it('should handle concurrent event creation', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('Test Item');

      // Create multiple events in quick succession
      const events = [];
      for (let i = 0; i < 10; i++) {
        const stockQuantity = new Quantity(i + 1);
        const event = new StockItemAdded(
          { aggregateId },
          stockItemName,
          stockQuantity
        );
        events.push(event);
      }

      // All events should have unique event IDs
      const eventIds = events.map(event => event.eventId.value);
      const uniqueEventIds = new Set(eventIds);
      expect(uniqueEventIds.size).toBe(10);

      // All events should have same aggregate ID
      events.forEach(event => {
        expect(event.aggregateId).toBe(aggregateId);
      });
    });
  });

  describe('integration with domain objects', () => {
    it('should work correctly with real domain objects', () => {
      // Create real domain objects
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('iPhone 15 Pro');
      const stockQuantity = new Quantity(50);

      // Create event using domain objects
      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      // Verify all properties
      expect(event.aggregateId).toBe(aggregateId);
      expect(event.name).toBe('iPhone 15 Pro');
      expect(event.quantity).toBe(50);
      expect(event.eventName()).toBe('inventory.stock_item.added');

      // Verify serialization includes correct data
      const primitives = event.toPrimitives();
      expect(primitives.name).toBe('iPhone 15 Pro');
      expect(primitives.quantity).toBe(50);
      expect(primitives.aggregateId).toBe(aggregateId.value);
    });

    it('should handle events with zero quantity', () => {
      const aggregateId = StockItemId.random();
      const stockItemName = StockItemName.from('Zero Stock Item');
      const stockQuantity = new Quantity(0);

      const event = new StockItemAdded(
        { aggregateId },
        stockItemName,
        stockQuantity
      );

      expect(event.quantity).toBe(0);
      expect(event.name).toBe('Zero Stock Item');

      const primitives = event.toPrimitives();
      expect(primitives.quantity).toBe(0);
      expect(primitives.name).toBe('Zero Stock Item');
    });
  });

  describe('event deserialization', () => {
    it('should deserialize from primitives correctly', () => {
      const primitives = {
        aggregateId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: '660e8400-e29b-41d4-a716-446655440000',
        occurredOn: '2023-01-01T12:00:00.000Z',
        eventName: 'inventory.stock_item.added',
        eventVersion: '1.0.0',
        name: 'iPhone 15',
        quantity: 100,
      };

      const event = StockItemAdded.fromPrimitives(primitives);

      expect(event.aggregateId.value).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(event.eventId.value).toBe('660e8400-e29b-41d4-a716-446655440000');
      expect(event.occurredOn).toEqual(new Date('2023-01-01T12:00:00.000Z'));
      expect(event.name).toBe('iPhone 15');
      expect(event.quantity).toBe(100);
    });

    it('should validate primitives before deserialization', () => {
      const invalidPrimitives = {
        aggregateId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: '660e8400-e29b-41d4-a716-446655440000',
        occurredOn: '2023-01-01T12:00:00.000Z',
        eventName: 'inventory.stock_item.added',
        eventVersion: '1.0.0',
        // Missing required fields
      };

      expect(() => StockItemAdded.fromPrimitives(invalidPrimitives))
        .toThrow('Missing name in event attributes');
    });

    it('should handle event version in serialization', () => {
      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const event = new StockItemAdded(
        { aggregateId },
        StockItemName.from('iPhone 15'),
        Quantity.from(100)
      );

      const primitives = event.toPrimitives();

      expect(primitives.eventVersion).toBe('1.0.0');
      expect(primitives.name).toBe('iPhone 15');
      expect(primitives.quantity).toBe(100);
    });
  });
});

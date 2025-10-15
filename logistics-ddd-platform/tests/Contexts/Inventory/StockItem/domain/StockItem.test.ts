import { StockItem } from '@/Contexts/Inventory/StockItem/domain/StockItem';
import { StockItemId } from '@/Contexts/Inventory/StockItem/domain/StockItemId';
import { StockItemName } from '@/Contexts/Inventory/StockItem/domain/StockItemName';
import { Quantity } from '@/Contexts/Inventory/StockItem/domain/Quantity';
import { StockItemAdded } from '@/Contexts/Inventory/StockItem/domain/events/StockItemAdded';
import { StockItemReserved } from '@/Contexts/Inventory/StockItem/domain/events/StockItemReserved';

describe('StockItem', () => {
  describe('creation', () => {
    it('should create stock item with valid parameters', () => {
      const id = StockItemId.random();
      const name = StockItemName.from('iPhone 15 Pro');
      const quantity = new Quantity(100);

      const stockItem = StockItem.add({ id, name, quantity });

      expect(stockItem.id).toBe(id);
      expect(stockItem.name).toBe(name);
      expect(stockItem.quantity.value).toBe(quantity.value);
      expect(stockItem.quantity.value).toBe(100);
    });

    it('should create stock item with zero quantity', () => {
      const id = StockItemId.random();
      const name = StockItemName.from('Out of Stock Item');
      const quantity = new Quantity(0);

      const stockItem = StockItem.add({ id, name, quantity });

      expect(stockItem.id).toBe(id);
      expect(stockItem.name).toBe(name);
      expect(stockItem.quantity.value).toBe(0);
    });

    it('should create stock item with large quantity', () => {
      const id = StockItemId.random();
      const name = StockItemName.from('Bulk Item');
      const quantity = new Quantity(1000000);

      const stockItem = StockItem.add({ id, name, quantity });

      expect(stockItem.quantity.value).toBe(1000000);
    });

    it('should create stock item with special characters in name', () => {
      const id = StockItemId.random();
      const name = StockItemName.from('iPhone 15 Pro Max (512GB) - Space Black');
      const quantity = new Quantity(50);

      const stockItem = StockItem.add({ id, name, quantity });

      expect(stockItem.name.value).toBe('iPhone 15 Pro Max (512GB) - Space Black');
    });
  });

  describe('domain events recording', () => {
    it('should record StockItemAdded event on creation', () => {
      const id = StockItemId.random();
      const name = StockItemName.from('iPhone 15');
      const quantity = new Quantity(100);

      const stockItem = StockItem.add({ id, name, quantity });
      const events = stockItem.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(StockItemAdded);

      const addedEvent = events[0] as StockItemAdded;
      expect(addedEvent.aggregateId).toBe(id);
      expect(addedEvent.name).toBe('iPhone 15');
      expect(addedEvent.quantity).toBe(100);
      expect(addedEvent.eventName()).toBe('inventory.stock_item.added');
    });

    it('should generate unique event IDs for each creation', () => {
      const id1 = StockItemId.random();
      const id2 = StockItemId.random();
      const name = StockItemName.from('Test Item');
      const quantity = new Quantity(10);

      const stockItem1 = StockItem.add({ id: id1, name, quantity });
      const stockItem2 = StockItem.add({ id: id2, name, quantity });

      const events1 = stockItem1.pullDomainEvents();
      const events2 = stockItem2.pullDomainEvents();

      expect(events1[0].eventId.value).not.toBe(events2[0].eventId.value);
    });

    it('should record events with correct timestamps', () => {
      const id = StockItemId.random();
      const name = StockItemName.from('Test Item');
      const quantity = new Quantity(10);
      const beforeCreation = new Date();

      const stockItem = StockItem.add({ id, name, quantity });
      const events = stockItem.pullDomainEvents();

      const afterCreation = new Date();
      expect(events[0].occurredOn).toBeInstanceOf(Date);
      expect(events[0].occurredOn.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(events[0].occurredOn.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('stock reservation', () => {
    it('should reserve stock successfully when sufficient quantity available', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('iPhone 15'),
        quantity: new Quantity(100),
      });

      stockItem.reserve(new Quantity(25), 'reservation-123');

      expect(stockItem.quantity.value).toBe(75);
    });

    it('should record StockItemReserved event when reserving stock', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('iPhone 15'),
        quantity: new Quantity(100),
      });

      // Clear the creation event
      stockItem.pullDomainEvents();

      stockItem.reserve(new Quantity(10), 'reservation-123');
      const events = stockItem.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(StockItemReserved);

      const reservedEvent = events[0] as StockItemReserved;
      expect(reservedEvent.aggregateId).toBe(id);
      expect(reservedEvent.stockItemId).toBe(id.value);
      expect(reservedEvent.reservedQuantity).toBe(10);
      expect(reservedEvent.reservationIdentifier).toBe('reservation-123');
    });

    it('should allow multiple reservations from same stock item', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('iPhone 15'),
        quantity: new Quantity(100),
      });

      stockItem.reserve(new Quantity(10), 'reservation-1');
      stockItem.reserve(new Quantity(20), 'reservation-2');
      stockItem.reserve(new Quantity(5), 'reservation-3');

      expect(stockItem.quantity.value).toBe(65);

      const events = stockItem.pullDomainEvents();
      // Should have 1 creation event + 3 reservation events
      expect(events).toHaveLength(4);

      const reservationEvents = events.slice(1); // Skip creation event
      expect(reservationEvents).toHaveLength(3);
      expect(reservationEvents.every(event => event instanceof StockItemReserved)).toBe(true);
    });

    it('should throw error when reserving more than available stock', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('iPhone 15'),
        quantity: new Quantity(5),
      });

      expect(() => {
        stockItem.reserve(new Quantity(10), 'reservation-123');
      }).toThrow('Insufficient stock');

      // Stock should remain unchanged
      expect(stockItem.quantity.value).toBe(5);
    });

    it('should not record event when reservation fails due to insufficient stock', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('iPhone 15'),
        quantity: new Quantity(5),
      });

      // Clear the creation event
      stockItem.pullDomainEvents();

      expect(() => {
        stockItem.reserve(new Quantity(10), 'reservation-123');
      }).toThrow('Insufficient stock');

      // No events should be recorded after failed reservation
      const events = stockItem.pullDomainEvents();
      expect(events).toHaveLength(0);
    });

    it('should handle reserving exact available quantity', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('iPhone 15'),
        quantity: new Quantity(50),
      });

      stockItem.reserve(new Quantity(50), 'reservation-full');

      expect(stockItem.quantity.value).toBe(0);

      const events = stockItem.pullDomainEvents();
      const reservationEvents = events.slice(1); // Skip creation event
      expect(reservationEvents).toHaveLength(1);

      const reservedEvent = reservationEvents[0] as StockItemReserved;
      expect(reservedEvent.reservedQuantity).toBe(50);
    });

    it('should handle reservations with different reservation IDs', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('iPhone 15'),
        quantity: new Quantity(200), // Increased from 100 to 200 to accommodate all reservations
      });

      const reservationIds = [
        'reservation-001',
        'reservation-002',
        'reservation-003',
        'reservation-abc-123',
        'reservation_xyz_456',
      ];

      reservationIds.forEach((reservationId, index) => {
        const quantityToReserve = (index + 1) * 10;
        stockItem.reserve(new Quantity(quantityToReserve), reservationId);
      });

      expect(stockItem.quantity.value).toBe(50); // 200 - (10+20+30+40+50) = 50

      const events = stockItem.pullDomainEvents();
      const reservationEvents = events.slice(1); // Skip creation event

      reservationEvents.forEach((event, index) => {
        const reservedEvent = event as StockItemReserved;
        expect(reservedEvent.reservationIdentifier).toBe(reservationIds[index]);
        expect(reservedEvent.reservedQuantity).toBe((index + 1) * 10);
      });
    });
  });

  describe('serialization', () => {
    it('should return correct primitive representation', () => {
      const id = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const name = StockItemName.from('iPhone 15 Pro');
      const quantity = new Quantity(100);

      const stockItem = StockItem.add({ id, name, quantity });
      const primitives = stockItem.toPrimitives();

      expect(primitives).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'iPhone 15 Pro',
        quantity: 100,
        availableQuantity: 100,
        reservedQuantity: 0,
        totalQuantity: 100,
        version: 2,
      });
    });

    it('should handle serialization with zero quantity', () => {
      const id = StockItemId.random();
      const name = StockItemName.from('Out of Stock');
      const quantity = new Quantity(0);

      const stockItem = StockItem.add({ id, name, quantity });
      const primitives = stockItem.toPrimitives();

      expect(primitives.quantity).toBe(0);
      expect(primitives.name).toBe('Out of Stock');
    });

    it('should handle serialization with large quantity', () => {
      const id = StockItemId.random();
      const name = StockItemName.from('Bulk Item');
      const quantity = new Quantity(999999);

      const stockItem = StockItem.add({ id, name, quantity });
      const primitives = stockItem.toPrimitives();

      expect(primitives.quantity).toBe(999999);
    });
  });

  describe('event properties verification', () => {
    it('should verify StockItemAdded event has correct properties', () => {
      const id = StockItemId.random();
      const name = StockItemName.from('Test Item');
      const quantity = new Quantity(42);

      const stockItem = StockItem.add({ id, name, quantity });
      const events = stockItem.pullDomainEvents();

      const addedEvent = events[0] as StockItemAdded;
      expect(addedEvent.eventName()).toBe('inventory.stock_item.added');
      expect(addedEvent.name).toBe('Test Item');
      expect(addedEvent.quantity).toBe(42);
      expect(addedEvent.aggregateId).toBe(id);
    });

    it('should verify StockItemReserved event has correct properties', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Test Item'),
        quantity: new Quantity(100),
      });

      stockItem.pullDomainEvents(); // Clear creation event
      stockItem.reserve(new Quantity(25), 'test-reservation-123');

      const events = stockItem.pullDomainEvents();
      const reservedEvent = events[0] as StockItemReserved;

      expect(reservedEvent.eventName()).toBe('inventory.stock_item.reserved');
      expect(reservedEvent.stockItemId).toBe(id.value);
      expect(reservedEvent.reservedQuantity).toBe(25);
      expect(reservedEvent.reservationIdentifier).toBe('test-reservation-123');
    });
  });

  describe('edge cases', () => {
    it('should handle reservation of minimum quantity (1)', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Single Item'),
        quantity: new Quantity(1),
      });

      stockItem.reserve(new Quantity(1), 'reservation-single');

      expect(stockItem.quantity.value).toBe(0);
    });

    it('should handle concurrent-like reservations correctly', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Concurrent Test Item'),
        quantity: new Quantity(100),
      });

      // Simulate multiple rapid reservations
      const reservations = [
        { quantity: 10, id: 'res-1' },
        { quantity: 15, id: 'res-2' },
        { quantity: 5, id: 'res-3' },
        { quantity: 20, id: 'res-4' },
        { quantity: 25, id: 'res-5' },
      ];

      reservations.forEach(({ quantity, id: reservationId }) => {
        stockItem.reserve(new Quantity(quantity), reservationId);
      });

      expect(stockItem.quantity.value).toBe(25); // 100 - (10+15+5+20+25) = 25

      const events = stockItem.pullDomainEvents();
      const reservationEvents = events.slice(1); // Skip creation event

      expect(reservationEvents).toHaveLength(5);
      reservationEvents.forEach((event, index) => {
        const reservedEvent = event as StockItemReserved;
        expect(reservedEvent.reservedQuantity).toBe(reservations[index].quantity);
        expect(reservedEvent.reservationIdentifier).toBe(reservations[index].id);
      });
    });

    it('should handle reservation when stock is exactly zero', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Zero Stock Item'),
        quantity: new Quantity(0),
      });

      expect(() => {
        stockItem.reserve(new Quantity(1), 'reservation-from-zero');
      }).toThrow('Insufficient stock');

      // Stock should remain zero
      expect(stockItem.quantity.value).toBe(0);
    });

    it('should handle very large reservation IDs', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Test Item'),
        quantity: new Quantity(100),
      });

      const largeReservationId = 'reservation-' + 'a'.repeat(1000);

      stockItem.reserve(new Quantity(10), largeReservationId);

      const events = stockItem.pullDomainEvents();
      const reservationEvents = events.slice(1); // Skip creation event

      expect((reservationEvents[0] as StockItemReserved).reservationIdentifier).toBe(largeReservationId);
    });
  });

  describe('business logic validation', () => {
    it('should maintain consistency between quantity and reservations', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Consistency Test Item'),
        quantity: new Quantity(100),
      });

      const initialQuantity = stockItem.quantity.value;

      // Make several reservations
      stockItem.reserve(new Quantity(10), 'res-1');
      stockItem.reserve(new Quantity(20), 'res-2');
      stockItem.reserve(new Quantity(15), 'res-3');

      const finalQuantity = stockItem.quantity.value;
      const totalReserved = 10 + 20 + 15; // 45

      expect(finalQuantity).toBe(initialQuantity - totalReserved);
      expect(finalQuantity).toBe(55);
    });

    it('should prevent over-reservation through business rules', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Limited Stock Item'),
        quantity: new Quantity(10),
      });

      // Should succeed
      stockItem.reserve(new Quantity(5), 'res-1');
      expect(stockItem.quantity.value).toBe(5);

      // Should succeed
      stockItem.reserve(new Quantity(3), 'res-2');
      expect(stockItem.quantity.value).toBe(2);

      // Should fail
      expect(() => {
        stockItem.reserve(new Quantity(3), 'res-3');
      }).toThrow('Insufficient stock');

      // Stock should remain at 2
      expect(stockItem.quantity.value).toBe(2);
    });
  });

  describe('integration with domain events', () => {
    it('should integrate correctly with domain event serialization', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Integration Test Item'),
        quantity: new Quantity(50),
      });

      // Clear creation event
      stockItem.pullDomainEvents();

      stockItem.reserve(new Quantity(10), 'integration-reservation');

      const events = stockItem.pullDomainEvents();
      const reservedEvent = events[0] as StockItemReserved;

      // Test that the event can be serialized properly
      const primitives = reservedEvent.toPrimitives();

      expect(primitives).toHaveProperty('aggregateId', id.value);
      expect(primitives).toHaveProperty('eventId');
      expect(primitives).toHaveProperty('occurredOn');
      expect(primitives).toHaveProperty('eventName', 'inventory.stock_item.reserved');
      expect(primitives).toHaveProperty('stockItemId', id.value);
      expect(primitives).toHaveProperty('reservedQuantity', 10);
      expect(primitives).toHaveProperty('reservationIdentifier', 'integration-reservation');
    });

    it('should work with both creation and reservation events together', () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Full Cycle Item'),
        quantity: new Quantity(100),
      });

      // Should have creation event
      const allEvents = stockItem.pullDomainEvents();
      expect(allEvents).toHaveLength(1);
      expect(allEvents[0]).toBeInstanceOf(StockItemAdded);

      // Make a reservation
      stockItem.reserve(new Quantity(25), 'full-cycle-reservation');

      // Should have reservation event
      const reservationEvents = stockItem.pullDomainEvents();
      expect(reservationEvents).toHaveLength(1);
      expect(reservationEvents[0]).toBeInstanceOf(StockItemReserved);

      // Total events recorded should be 2 (1 creation + 1 reservation)
      const totalEvents = [...allEvents, ...reservationEvents];
      expect(totalEvents).toHaveLength(2);
    });
  });
});

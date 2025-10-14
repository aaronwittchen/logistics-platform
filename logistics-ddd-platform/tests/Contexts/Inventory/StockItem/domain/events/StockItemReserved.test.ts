// logistics-ddd-platform/tests/Contexts/Inventory/StockItem/domain/events/StockItemReserved.test.ts
import { StockItemReserved } from '@/Contexts/Inventory/StockItem/domain/events/StockItemReserved';
import { StockItemId } from '@/Contexts/Inventory/StockItem/domain/StockItemId';
import { Quantity } from '@/Contexts/Inventory/StockItem/domain/Quantity';
import { Uuid } from '@/Shared/domain/Uuid';
import { DomainEventPrimitives } from '@/Shared/domain/DomainEvent';

describe('StockItemReserved', () => {
  describe('constructor', () => {
    it('should create event with required parameters', () => {
      const aggregateId = StockItemId.random();
      const stockItemId = StockItemId.random();
      const quantity = new Quantity(10);
      const reservationId = 'reservation-123';

      const event = new StockItemReserved(
        { aggregateId },
        stockItemId,
        quantity,
        reservationId
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe(aggregateId);
      expect(event.eventName()).toBe('inventory.stock_item.reserved');
      expect(event.stockItemId).toBe(stockItemId.value);
      expect(event.reservedQuantity).toBe(10);
      expect(event.reservationIdentifier).toBe('reservation-123');
    });

    it('should create event with custom metadata', () => {
      const aggregateId = StockItemId.random();
      const stockItemId = StockItemId.random();
      const quantity = new Quantity(5);
      const reservationId = 'reservation-456';
      const customEventId = Uuid.random();
      const customTimestamp = new Date('2023-01-01T12:00:00.000Z');

      const event = new StockItemReserved(
        { aggregateId, eventId: customEventId, occurredOn: customTimestamp },
        stockItemId,
        quantity,
        reservationId
      );

      expect(event.eventId).toBe(customEventId);
      expect(event.occurredOn).toBe(customTimestamp);
      expect(event.reservedQuantity).toBe(5);
      expect(event.reservationIdentifier).toBe('reservation-456');
    });
  });

  describe('payload serialization', () => {
    it('should return correct payload', () => {
      const aggregateId = StockItemId.random();
      const stockItemId = StockItemId.random();
      const quantity = new Quantity(25);
      const reservationId = 'reservation-789';

      const event = new StockItemReserved(
        { aggregateId },
        stockItemId,
        quantity,
        reservationId
      );

      const payload = (event as any).toPayload();
      expect(payload).toEqual({
        stockItemId: stockItemId.value,
        reservedQuantity: 25,
        reservationIdentifier: 'reservation-789',
      });
    });

    it('should serialize to primitives correctly', () => {
      const aggregateId = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const stockItemId = StockItemId.from('660e8400-e29b-41d4-a716-446655440000');
      const eventId = Uuid.from('770e8400-e29b-41d4-a716-446655440000');
      const occurredOn = new Date('2023-01-01T12:00:00.000Z');
      const quantity = new Quantity(15);
      const reservationId = 'reservation-abc';

      const event = new StockItemReserved(
        { aggregateId, eventId, occurredOn },
        stockItemId,
        quantity,
        reservationId
      );

      const primitives = event.toPrimitives();

      expect(primitives).toEqual({
        aggregateId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: '770e8400-e29b-41d4-a716-446655440000',
        occurredOn: '2023-01-01T12:00:00.000Z',
        eventName: 'inventory.stock_item.reserved',
        eventVersion: '1.0.0',
        stockItemId: '660e8400-e29b-41d4-a716-446655440000',
        reservedQuantity: 15,
        reservationIdentifier: 'reservation-abc',
      });
    });
  });

  describe('equality comparison', () => {
    it('should be equal to event with same data', () => {
      const aggregateId = StockItemId.random();
      const stockItemId = StockItemId.random();
      const quantity = new Quantity(10);
      const reservationId = 'reservation-123';

      const event1 = new StockItemReserved(
        { aggregateId },
        stockItemId,
        quantity,
        reservationId
      );

      const event2 = new StockItemReserved(
        { aggregateId },
        stockItemId,
        quantity,
        reservationId
      );

      expect(event1.equals(event2)).toBe(true);
    });

    it('should not be equal with different stock item ID', () => {
      const aggregateId = StockItemId.random();
      const quantity = new Quantity(10);
      const reservationId = 'reservation-123';

      const event1 = new StockItemReserved(
        { aggregateId },
        StockItemId.random(),
        quantity,
        reservationId
      );

      const event2 = new StockItemReserved(
        { aggregateId },
        StockItemId.random(),
        quantity,
        reservationId
      );

      expect(event1.equals(event2)).toBe(false);
    });

    it('should not be equal with different quantity', () => {
      const aggregateId = StockItemId.random();
      const stockItemId = StockItemId.random();
      const reservationId = 'reservation-123';

      const event1 = new StockItemReserved(
        { aggregateId },
        stockItemId,
        new Quantity(10),
        reservationId
      );

      const event2 = new StockItemReserved(
        { aggregateId },
        stockItemId,
        new Quantity(20),
        reservationId
      );

      expect(event1.equals(event2)).toBe(false);
    });

    it('should not be equal with different reservation ID', () => {
      const aggregateId = StockItemId.random();
      const stockItemId = StockItemId.random();
      const quantity = new Quantity(10);

      const event1 = new StockItemReserved(
        { aggregateId },
        stockItemId,
        quantity,
        'reservation-123'
      );

      const event2 = new StockItemReserved(
        { aggregateId },
        stockItemId,
        quantity,
        'reservation-456'
      );

      expect(event1.equals(event2)).toBe(false);
    });
  });

  describe('fromPrimitives factory method', () => {
    it('should create event from primitives', () => {
      const params = {
        aggregateId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: '770e8400-e29b-41d4-a716-446655440000',
        occurredOn: '2023-01-01T12:00:00.000Z',
        eventName: 'inventory.stock_item.reserved',
        eventVersion: '1.0.0',
        stockItemId: '660e8400-e29b-41d4-a716-446655440000',
        reservedQuantity: 15,
        reservationIdentifier: 'reservation-abc',
      };

      const event = StockItemReserved.fromPrimitives(params);

      expect(event.aggregateId.value).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(event.eventId.value).toBe('770e8400-e29b-41d4-a716-446655440000');
      expect(event.occurredOn).toEqual(new Date('2023-01-01T12:00:00.000Z'));
      expect(event.stockItemId).toBe('660e8400-e29b-41d4-a716-446655440000');
      expect(event.reservedQuantity).toBe(15);
      expect(event.reservationIdentifier).toBe('reservation-abc');
    });
  });

  describe('edge cases', () => {
    it('should handle zero quantity reservation', () => {
      const aggregateId = StockItemId.random();
      const stockItemId = StockItemId.random();
      const quantity = new Quantity(0);
      const reservationId = 'reservation-zero';

      const event = new StockItemReserved(
        { aggregateId },
        stockItemId,
        quantity,
        reservationId
      );

      expect(event.reservedQuantity).toBe(0);
      expect(event.reservationIdentifier).toBe('reservation-zero');
    });

    it('should handle large quantity reservation', () => {
      const aggregateId = StockItemId.random();
      const stockItemId = StockItemId.random();
      const quantity = new Quantity(1000000);
      const reservationId = 'reservation-large';

      const event = new StockItemReserved(
        { aggregateId },
        stockItemId,
        quantity,
        reservationId
      );

      expect(event.reservedQuantity).toBe(1000000);
    });

    it('should handle special characters in reservation ID', () => {
      const aggregateId = StockItemId.random();
      const stockItemId = StockItemId.random();
      const quantity = new Quantity(10);
      const reservationId = 'reservation-123_ABC-xyz.456';

      const event = new StockItemReserved(
        { aggregateId },
        stockItemId,
        quantity,
        reservationId
      );

      expect(event.reservationIdentifier).toBe('reservation-123_ABC-xyz.456');
    });
  });
});
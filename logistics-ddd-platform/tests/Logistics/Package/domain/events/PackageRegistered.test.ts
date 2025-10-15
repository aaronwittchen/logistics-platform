import { PackageRegistered } from '@/Contexts/Logistics/Package/domain/events/PackageRegistered';
import { Uuid } from '@/Shared/domain/Uuid';

describe('PackageRegistered', () => {
  describe('constructor', () => {
    it('should create event with required parameters', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const trackingNumber = 'ABCD123456';
      const reservationId = 'reservation-123';

      const event = new PackageRegistered({ aggregateId: Uuid.from(id) }, trackingNumber, reservationId);

      expect(event).toBeDefined();
      expect(event.aggregateId.value).toBe(id);
      expect(event.eventName()).toBe('logistics.package.registered');
      expect(event.packageId).toBe(id);
      expect(event.packageTrackingNumber).toBe(trackingNumber);
      expect(event.fulfilledReservationId).toBe(reservationId);
    });

    it('should create event with custom metadata', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const trackingNumber = 'EFGH567890';
      const reservationId = 'reservation-456';
      const customEventId = '660e8400-e29b-41d4-a716-446655440000';
      const customTimestamp = new Date('2023-01-01T12:00:00.000Z');

      const event = new PackageRegistered({ aggregateId: Uuid.from(id), eventId: Uuid.from(customEventId), occurredOn: customTimestamp }, trackingNumber, reservationId);

      expect(event.eventId.value).toBe(customEventId);
      expect(event.occurredOn).toBe(customTimestamp);
      expect(event.packageTrackingNumber).toBe(trackingNumber);
      expect(event.fulfilledReservationId).toBe(reservationId);
    });
  });

  describe('payload serialization', () => {
    it('should return correct payload', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const trackingNumber = 'ABCD123456';
      const reservationId = 'reservation-123';

      const event = new PackageRegistered({ aggregateId: Uuid.from(id) }, trackingNumber, reservationId);

      const payload = (event as any).toPayload();
      expect(payload).toEqual({
        id,
        trackingNumber,
        reservationId,
      });
    });

    it('should serialize to primitives correctly', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const trackingNumber = 'ABCD123456';
      const reservationId = 'reservation-123';
      const eventId = '660e8400-e29b-41d4-a716-446655440000';
      const occurredOn = new Date('2023-01-01T12:00:00.000Z');

      const event = new PackageRegistered({ aggregateId: Uuid.from(id), eventId: Uuid.from(eventId), occurredOn }, trackingNumber, reservationId);

      const primitives = event.toPrimitives();

      expect(primitives).toEqual({
        aggregateId: id,
        eventId,
        occurredOn: occurredOn.toISOString(),
        eventName: 'logistics.package.registered',
        eventVersion: '1.0.0',
        id,
        trackingNumber,
        reservationId,
      });
    });
  });

  describe('equality comparison', () => {
    it('should be equal to event with same data', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const trackingNumber = 'ABCD123456';
      const reservationId = 'reservation-123';

      const event1 = new PackageRegistered({ aggregateId: Uuid.from(id) }, trackingNumber, reservationId);

      const event2 = new PackageRegistered({ aggregateId: Uuid.from(id) }, trackingNumber, reservationId);

      expect(event1.equals(event2)).toBe(true);
    });

    it('should not be equal with different ID', () => {
      const trackingNumber = 'ABCD123456';
      const reservationId = 'reservation-123';

      const event1 = new PackageRegistered({ aggregateId: Uuid.from('550e8400-e29b-41d4-a716-446655440000') }, trackingNumber, reservationId);

      const event2 = new PackageRegistered({ aggregateId: Uuid.from('660e8400-e29b-41d4-a716-446655440000') }, trackingNumber, reservationId);

      expect(event1.equals(event2)).toBe(false);
    });

    it('should not be equal with different tracking number', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const reservationId = 'reservation-123';

      const event1 = new PackageRegistered({ aggregateId: Uuid.from(id) }, 'ABCD123456', reservationId);

      const event2 = new PackageRegistered({ aggregateId: Uuid.from(id) }, 'EFGH567890', reservationId);

      expect(event1.equals(event2)).toBe(false);
    });

    it('should not be equal with different reservation ID', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const trackingNumber = 'ABCD123456';

      const event1 = new PackageRegistered({ aggregateId: Uuid.from(id) }, trackingNumber, 'reservation-123');

      const event2 = new PackageRegistered({ aggregateId: Uuid.from(id) }, trackingNumber, 'reservation-456');

      expect(event1.equals(event2)).toBe(false);
    });
  });

  describe('fromPrimitives factory method', () => {
    it('should create event from primitives', () => {
      const params = {
        aggregateId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: '660e8400-e29b-41d4-a716-446655440000',
        occurredOn: '2023-01-01T12:00:00.000Z',
        eventName: 'logistics.package.registered',
        eventVersion: '1.0.0',
        id: '550e8400-e29b-41d4-a716-446655440000',
        trackingNumber: 'ABCD123456',
        reservationId: 'reservation-123',
      };

      const event = PackageRegistered.fromPrimitives(params);

      expect(event.aggregateId.value).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(event.eventId.value).toBe('660e8400-e29b-41d4-a716-446655440000');
      expect(event.occurredOn).toEqual(new Date('2023-01-01T12:00:00.000Z'));
      expect(event.packageId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(event.packageTrackingNumber).toBe('ABCD123456');
      expect(event.fulfilledReservationId).toBe('reservation-123');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in reservation ID', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const trackingNumber = 'ABCD123456';
      const reservationId = 'reservation-123_ABC-xyz.456';

      const event = new PackageRegistered({ aggregateId: Uuid.from(id) }, trackingNumber, reservationId);

      expect(event.fulfilledReservationId).toBe('reservation-123_ABC-xyz.456');
    });

    it('should handle long reservation IDs', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const trackingNumber = 'ABCD123456';
      const reservationId = 'reservation-' + 'a'.repeat(100);

      const event = new PackageRegistered({ aggregateId: Uuid.from(id) }, trackingNumber, reservationId);

      expect(event.fulfilledReservationId).toBe(reservationId);
    });

    it('should handle different tracking number formats', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const reservationId = 'reservation-123';

      const testCases = ['ABCDEFGHIJ', '0123456789', 'A1B2C3D4E5', '12345ABCDE'];

      testCases.forEach(trackingNumber => {
        const event = new PackageRegistered({ aggregateId: Uuid.from(id) }, trackingNumber, reservationId);
        expect(event.packageTrackingNumber).toBe(trackingNumber);
      });
    });
  });
});

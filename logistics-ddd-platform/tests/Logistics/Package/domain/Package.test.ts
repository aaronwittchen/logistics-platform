import { Package } from '@/Contexts/Logistics/Package/domain/Package';
import { PackageId } from '@/Contexts/Logistics/Package/domain/PackageId';
import { TrackingNumber } from '@/Contexts/Logistics/Package/domain/TrackingNumber';
import { PackageRegistered } from '@/Contexts/Logistics/Package/domain/events/PackageRegistered';

describe('Package', () => {
  describe('Package.register', () => {
    it('should register package successfully', () => {
      const id = PackageId.random();
      const trackingNumber = TrackingNumber.generate();
      const reservationId = 'order-123';

      const pkg = Package.register(id, trackingNumber, reservationId);

      expect(pkg.getId()).toEqual(id);
      expect(pkg.getTrackingNumber()).toEqual(trackingNumber);
      expect(pkg.getReservationId()).toBe(reservationId);
      expect(pkg.getStatus()).toBe('registered');
    });

    it('should record PackageRegistered event on registration', () => {
      const id = PackageId.random();
      const trackingNumber = TrackingNumber.generate();
      const reservationId = 'order-123';

      const pkg = Package.register(id, trackingNumber, reservationId);
      const events = pkg.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PackageRegistered);

      const event = events[0] as PackageRegistered;
      expect(event.packageId).toBe(id.value);
      expect(event.packageTrackingNumber).toBe(trackingNumber.value);
      expect(event.fulfilledReservationId).toBe(reservationId);
    });

    it('should generate valid tracking numbers', () => {
      const trackingNumber = TrackingNumber.generate();

      expect(trackingNumber.value).toHaveLength(10);
      expect(trackingNumber.value).toMatch(/^[A-Z0-9]+$/);
    });

    it('should create tracking number from valid string', () => {
      const validTracking = 'ABC123XYZ9';
      const trackingNumber = TrackingNumber.from(validTracking);

      expect(trackingNumber.value).toBe(validTracking);
    });

    it('should throw error for invalid tracking number length', () => {
      expect(() => {
        new TrackingNumber('SHORT');
      }).toThrow('Tracking number must be 10 characters long');
    });

    it('should throw error for invalid tracking number characters', () => {
      expect(() => {
        new TrackingNumber('ABC123XYZ!');
      }).toThrow('Tracking number must contain only uppercase letters and numbers');
    });
  });

  describe('Package state transitions', () => {
    it('should transition from registered to in_transit', () => {
      const id = PackageId.random();
      const trackingNumber = TrackingNumber.generate();
      const pkg = Package.register(id, trackingNumber, 'order-123');

      pkg.markInTransit();
      expect(pkg.getStatus()).toBe('in_transit');
    });

    it('should transition from in_transit to delivered', () => {
      const id = PackageId.random();
      const trackingNumber = TrackingNumber.generate();
      const pkg = Package.register(id, trackingNumber, 'order-123');

      pkg.markInTransit();
      pkg.markDelivered();
      expect(pkg.getStatus()).toBe('delivered');
    });

    it('should throw error when marking non-registered package as in_transit', () => {
      const id = PackageId.random();
      const trackingNumber = TrackingNumber.generate();

      // Create package directly without register method to test invalid state
      const pkg = new (Package as any)(id, trackingNumber, 'order-123');

      expect(() => {
        pkg.markInTransit();
      }).toThrow('Package must be registered before transit');
    });

    it('should throw error when marking non-transit package as delivered', () => {
      const id = PackageId.random();
      const trackingNumber = TrackingNumber.generate();

      // Create package directly to test invalid state transition
      const pkg = new (Package as any)(id, trackingNumber, 'order-123');

      expect(() => {
        pkg.markDelivered();
      }).toThrow('Package must be in transit before delivery');
    });
  });

  describe('Package.toPrimitives', () => {
    it('should return correct primitive representation', () => {
      const id = PackageId.random();
      const trackingNumber = TrackingNumber.generate();
      const reservationId = 'order-123';

      const pkg = Package.register(id, trackingNumber, reservationId);
      const primitives = pkg.toPrimitives();

      expect(primitives).toEqual({
        id: id.value,
        trackingNumber: trackingNumber.value,
        reservationId: reservationId,
        status: 'registered',
      });
    });
  });

  describe('PackageId', () => {
    it('should generate random PackageId', () => {
      const id1 = PackageId.random();
      const id2 = PackageId.random();

      expect(id1).not.toEqual(id2);
      expect(id1.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create PackageId from string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = PackageId.from(uuid);

      expect(id.value).toBe(uuid);
    });
  });
});

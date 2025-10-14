import { EventRegistry } from '@/Shared/infrastructure/event-bus/EventRegistry';
import { StockItemAdded } from '@/Contexts/Inventory/StockItem/domain/events/StockItemAdded';
import { PackageRegistered } from '@/Contexts/Logistics/Package/domain/events/PackageRegistered';

describe('EventRegistry', () => {
  let registry: EventRegistry;

  beforeEach(() => {
    registry = EventRegistry.getInstance();
    // Clear registry for clean state
    (registry as any).events.clear();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EventRegistry.getInstance();
      const instance2 = EventRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('event registration', () => {
    it('should register events correctly', () => {
      registry.register(StockItemAdded, '1.0.0');

      const eventClass = registry.getEventClass('inventory.stock_item.added');
      expect(eventClass).toBe(StockItemAdded);

      const version = registry.getEventVersion('inventory.stock_item.added');
      expect(version).toBe('1.0.0');
    });

    it('should handle multiple event registrations', () => {
      registry.register(StockItemAdded, '1.0.0');
      registry.register(PackageRegistered, '2.0.0');

      expect(registry.getEventClass('inventory.stock_item.added')).toBe(StockItemAdded);
      expect(registry.getEventClass('logistics.package.registered')).toBe(PackageRegistered);

      expect(registry.getEventVersion('inventory.stock_item.added')).toBe('1.0.0');
      expect(registry.getEventVersion('logistics.package.registered')).toBe('2.0.0');
    });

    it('should throw error for unknown event types', () => {
      expect(() => registry.getEventClass('unknown.event')).toThrow('Unknown event type: unknown.event');
    });

    it('should return default version for unregistered events', () => {
      const version = registry.getEventVersion('unknown.event');
      expect(version).toBe('1.0.0');
    });
  });

  describe('event listing', () => {
    it('should return all registered events', () => {
      registry.register(StockItemAdded, '1.0.0');
      registry.register(PackageRegistered, '2.0.0');

      const allEvents = registry.getAllEvents();

      expect(allEvents).toHaveLength(2);
      expect(allEvents).toContainEqual({ name: 'inventory.stock_item.added', version: '1.0.0' });
      expect(allEvents).toContainEqual({ name: 'logistics.package.registered', version: '2.0.0' });
    });

    it('should return empty array when no events are registered', () => {
      const allEvents = registry.getAllEvents();
      expect(allEvents).toHaveLength(0);
    });
  });
});

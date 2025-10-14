import { AddStockCommandHandler } from '@/Contexts/Inventory/StockItem/application/AddStock/AddStockCommandHandler';
import { AddStockCommand } from '@/Contexts/Inventory/StockItem/application/AddStock/AddStockCommand';
import { StockItemRepository } from '@/Contexts/Inventory/StockItem/domain/StockItemRepository';
import { StockItem } from '@/Contexts/Inventory/StockItem/domain/StockItem';
import { StockItemId } from '@/Contexts/Inventory/StockItem/domain/StockItemId';
import { StockItemName } from '@/Contexts/Inventory/StockItem/domain/StockItemName';
import { Quantity } from '@/Contexts/Inventory/StockItem/domain/Quantity';
import { DomainEvent } from '@/Shared/domain/DomainEvent';
import { EventBus } from '@/Shared/domain/EventBus';

// Mock implementations for testing
class MockStockItemRepository implements StockItemRepository {
  private items: Map<string, StockItem> = new Map();
  public saveCallCount = 0;
  public savedItem: StockItem | null = null;

  async save(stockItem: StockItem): Promise<void> {
    this.saveCallCount++;
    this.savedItem = stockItem;
    this.items.set(stockItem.id.value, stockItem);
  }

  async find(id: StockItemId): Promise<StockItem | null> {
    return this.items.get(id.value) || null;
  }

  async findAll(): Promise<StockItem[]> {
    return Array.from(this.items.values());
  }

  async delete(id: StockItemId): Promise<void> {
    this.items.delete(id.value);
  }

  // Helper methods for testing
  clear(): void {
    this.items.clear();
    this.saveCallCount = 0;
    this.savedItem = null;
  }
}

class MockEventBus implements EventBus {
  public publishedEvents: DomainEvent[][] = [];
  public subscribeCallCount = 0;
  public unsubscribeCallCount = 0;

  async publish(events: DomainEvent[]): Promise<void> {
    this.publishedEvents.push([...events]);
  }

  subscribe<T extends DomainEvent>(event: any, handler: any): void {
    this.subscribeCallCount++;
  }

  unsubscribe<T extends DomainEvent>(event: any, handler: any): void {
    this.unsubscribeCallCount++;
  }

  // Helper methods for testing
  clear(): void {
    this.publishedEvents = [];
    this.subscribeCallCount = 0;
    this.unsubscribeCallCount = 0;
  }
}

describe('AddStockCommandHandler', () => {
  let repository: MockStockItemRepository;
  let eventBus: MockEventBus;
  let handler: AddStockCommandHandler;

  beforeEach(() => {
    repository = new MockStockItemRepository();
    eventBus = new MockEventBus();
    handler = new AddStockCommandHandler(repository, eventBus);
  });

  afterEach(() => {
    repository.clear();
    eventBus.clear();
  });

  describe('constructor', () => {
    it('should create handler with repository only', () => {
      const handlerWithoutEventBus = new AddStockCommandHandler(repository);

      expect(handlerWithoutEventBus).toBeDefined();
    });

    it('should create handler with repository and eventBus', () => {
      const handlerWithEventBus = new AddStockCommandHandler(repository, eventBus);

      expect(handlerWithEventBus).toBeDefined();
    });

    it('should work without eventBus (optional dependency)', () => {
      const handlerWithoutEventBus = new AddStockCommandHandler(repository);

      expect(handlerWithoutEventBus).toBeDefined();
    });
  });

  describe('execute method', () => {
    it('should successfully add stock item', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'iPhone 15',
        100
      );

      await handler.execute(command);

      expect(repository.saveCallCount).toBe(1);
      expect(repository.savedItem).toBeDefined();

      const savedItem = repository.savedItem!;
      expect(savedItem.id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(savedItem.name.value).toBe('iPhone 15');
      expect(savedItem.quantity.value).toBe(100);
    });

    it('should publish domain events when eventBus is provided', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'iPhone 15',
        100
      );

      await handler.execute(command);

      expect(eventBus.publishedEvents).toHaveLength(1);
      expect(eventBus.publishedEvents[0]).toHaveLength(1);

      const publishedEvent = eventBus.publishedEvents[0][0];
      expect(publishedEvent.eventName()).toBe('inventory.stock_item.added');
    });

    it('should not publish events when eventBus is not provided', async () => {
      const handlerWithoutEventBus = new AddStockCommandHandler(repository);
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'iPhone 15',
        100
      );

      await handlerWithoutEventBus.execute(command);

      expect(eventBus.publishedEvents).toHaveLength(0);
    });

    it('should handle command using factory method', async () => {
      const commandData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Samsung Galaxy',
        quantity: 50
      };

      const command = AddStockCommand.fromPrimitives(commandData);

      await handler.execute(command);

      const savedItem = repository.savedItem!;
      expect(savedItem.id.value).toBe(commandData.id);
      expect(savedItem.name.value).toBe(commandData.name);
      expect(savedItem.quantity.value).toBe(commandData.quantity);
    });

    it('should handle multiple stock items correctly', async () => {
      const commands = [
        new AddStockCommand('550e8400-e29b-41d4-a716-446655440000', 'iPhone 15', 100),
        new AddStockCommand('660e8400-e29b-41d4-a716-446655440000', 'Samsung Galaxy', 50),
        new AddStockCommand('770e8400-e29b-41d4-a716-446655440000', 'MacBook Pro', 25)
      ];

      for (const command of commands) {
        await handler.execute(command);
      }

      expect(repository.saveCallCount).toBe(3);
      expect(await repository.findAll()).toHaveLength(3);

      // Verify all items were saved correctly
      const savedItems = await repository.findAll();
      expect(savedItems).toHaveLength(3);

      const expectedItems = [
        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'iPhone 15', quantity: 100 },
        { id: '660e8400-e29b-41d4-a716-446655440000', name: 'Samsung Galaxy', quantity: 50 },
        { id: '770e8400-e29b-41d4-a716-446655440000', name: 'MacBook Pro', quantity: 25 }
      ];

      expectedItems.forEach((expected, index) => {
        const item = savedItems[index];
        expect(item.id.value).toBe(expected.id);
        expect(item.name.value).toBe(expected.name);
        expect(item.quantity.value).toBe(expected.quantity);
      });
    });

    it('should handle events published in correct order', async () => {
      const command1 = new AddStockCommand('550e8400-e29b-41d4-a716-446655440000', 'Item 1', 10);
      const command2 = new AddStockCommand('660e8400-e29b-41d4-a716-446655440000', 'Item 2', 20);

      await handler.execute(command1);
      await handler.execute(command2);

      expect(eventBus.publishedEvents).toHaveLength(2);

      // Each execution should publish one event
      expect(eventBus.publishedEvents[0]).toHaveLength(1);
      expect(eventBus.publishedEvents[1]).toHaveLength(1);

      // Events should be in order of execution
      expect(eventBus.publishedEvents[0][0].aggregateId.value).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(eventBus.publishedEvents[1][0].aggregateId.value).toBe('660e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('domain object creation', () => {
    it('should create correct domain objects from command', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Test Product',
        42
      );

      await handler.execute(command);

      const savedItem = repository.savedItem!;
      expect(savedItem.id).toBeInstanceOf(StockItemId);
      expect(savedItem.name).toBeInstanceOf(StockItemName);
      expect(savedItem.quantity).toBeInstanceOf(Quantity);

      expect(savedItem.id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(savedItem.name.value).toBe('Test Product');
      expect(savedItem.quantity.value).toBe(42);
    });

    it('should handle special characters in product names', async () => {
      const specialNames = [
        'iPhone 15 Pro Max (512GB)',
        'Samsung Galaxy S24 Ultra',
        'MacBook Pro 16" M3 Max',
        'iPad Pro 12.9" (6th Gen)',
        'AirPods Pro (2nd generation)'
      ];

      for (const name of specialNames) {
        const command = new AddStockCommand(
          '550e8400-e29b-41d4-a716-446655440000',
          name,
          10
        );

        await handler.execute(command);

        const savedItem = repository.savedItem!;
        expect(savedItem.name.value).toBe(name);
      }
    });

    it('should handle edge case quantities', async () => {
      const edgeQuantities = [0, 1, 1000, 100000, 1000000];

      for (const quantity of edgeQuantities) {
        const command = new AddStockCommand(
          '550e8400-e29b-41d4-a716-446655440000',
          'Edge Case Item',
          quantity
        );

        await handler.execute(command);

        const savedItem = repository.savedItem!;
        expect(savedItem.quantity.value).toBe(quantity);
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid UUID in command', async () => {
      const command = new AddStockCommand(
        'invalid-uuid',
        'Test Product',
        10
      );

      await expect(handler.execute(command)).rejects.toThrow('Invalid UUID');
    });

    it('should handle invalid quantity values', async () => {
      const invalidQuantities = [-1, 1.5, Infinity, NaN];

      for (const quantity of invalidQuantities) {
        const command = new AddStockCommand(
          '550e8400-e29b-41d4-a716-446655440000',
          'Test Product',
          quantity
        );

        await expect(handler.execute(command)).rejects.toThrow();
      }
    });

    it('should handle empty product names', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        '',
        10
      );

      await expect(handler.execute(command)).rejects.toThrow();
    });

    it('should handle extremely large but valid quantities', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Bulk Item',
        1000000000 // Maximum allowed quantity
      );

      await handler.execute(command);

      const savedItem = repository.savedItem!;
      expect(savedItem.quantity.value).toBe(1000000000);
    });
  });

  describe('repository interaction', () => {
    it('should call repository save method exactly once per execution', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Test Product',
        10
      );

      await handler.execute(command);

      expect(repository.saveCallCount).toBe(1);
      expect(repository.savedItem).toBeDefined();
    });

    it('should save the correct stock item to repository', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Repository Test Item',
        25
      );

      await handler.execute(command);

      const savedItem = repository.savedItem!;
      expect(savedItem.id.value).toBe(command.id);
      expect(savedItem.name.value).toBe(command.name);
      expect(savedItem.quantity.value).toBe(command.quantity);
    });

    it('should be able to retrieve saved item using repository find method', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Find Test Item',
        15
      );

      await handler.execute(command);

      const foundItem = await repository.find(StockItemId.from(command.id));
      expect(foundItem).toBeDefined();
      expect(foundItem!.id.value).toBe(command.id);
      expect(foundItem!.name.value).toBe(command.name);
      expect(foundItem!.quantity.value).toBe(command.quantity);
    });

    it('should handle repository errors gracefully', async () => {
      const errorRepository = new MockStockItemRepository();
      const errorHandler = new AddStockCommandHandler(errorRepository, eventBus);

      // Override save to throw an error
      const originalSave = errorRepository.save.bind(errorRepository);
      errorRepository.save = async (stockItem: StockItem) => {
        throw new Error('Database connection failed');
      };

      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Error Test Item',
        10
      );

      await expect(errorHandler.execute(command)).rejects.toThrow('Database connection failed');
    });
  });

  describe('event bus interaction', () => {
    it('should publish events only when eventBus is provided', async () => {
      const handlerWithEventBus = new AddStockCommandHandler(repository, eventBus);
      const handlerWithoutEventBus = new AddStockCommandHandler(repository);

      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Event Bus Test',
        10
      );

      await handlerWithEventBus.execute(command);
      await handlerWithoutEventBus.execute(command);

      expect(eventBus.publishedEvents).toHaveLength(1); // Only from handlerWithEventBus
    });

    it('should publish all domain events from the aggregate', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Multiple Events Item',
        10
      );

      await handler.execute(command);

      expect(eventBus.publishedEvents).toHaveLength(1);
      expect(eventBus.publishedEvents[0]).toHaveLength(1);

      const publishedEvent = eventBus.publishedEvents[0][0];
      expect(publishedEvent.eventName()).toBe('inventory.stock_item.added');
    });

    it('should not fail if eventBus publish throws error', async () => {
      const errorEventBus = new MockEventBus();
      
      // Store original method
      const originalPublish = errorEventBus.publish;
      
      // Override with error-throwing version
      errorEventBus.publish = async (events: DomainEvent[]) => {
        throw new Error('Event bus connection failed');
      };
      
      const errorHandler = new AddStockCommandHandler(repository, errorEventBus);

      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Event Bus Error Test',
        10
      );

      // Should still save to repository even if event publishing fails
      await errorHandler.execute(command);

      expect(repository.saveCallCount).toBe(1); // Verifies item was saved despite event bus failure
      const savedItem = repository.savedItem!;
      expect(savedItem.name.value).toBe('Event Bus Error Test');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow with repository and event bus', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Integration Test Item',
        100
      );

      // Execute the handler
      await handler.execute(command);

      // Verify repository interaction
      expect(repository.saveCallCount).toBe(1);
      const savedItem = repository.savedItem!;
      expect(savedItem.id.value).toBe(command.id);
      expect(savedItem.name.value).toBe(command.name);
      expect(savedItem.quantity.value).toBe(command.quantity);

      // Verify event bus interaction
      expect(eventBus.publishedEvents).toHaveLength(1);
      const publishedEvents = eventBus.publishedEvents[0];
      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0].eventName()).toBe('inventory.stock_item.added');

      // Verify the item can be retrieved
      const retrievedItem = await repository.find(StockItemId.from(command.id));
      expect(retrievedItem).toBeDefined();
      expect(retrievedItem!.id).toEqual(savedItem.id);
    });

    it('should handle concurrent-like operations correctly', async () => {
      const commands = [
        new AddStockCommand('550e8400-e29b-41d4-a716-446655440000', 'Item 1', 10),
        new AddStockCommand('660e8400-e29b-41d4-a716-446655440000', 'Item 2', 20),
        new AddStockCommand('770e8400-e29b-41d4-a716-446655440000', 'Item 3', 30),
        new AddStockCommand('880e8400-e29b-41d4-a716-446655440000', 'Item 4', 40),
        new AddStockCommand('990e8400-e29b-41d4-a716-446655440000', 'Item 5', 50)
      ];

      // Execute all commands
      await Promise.all(commands.map(cmd => handler.execute(cmd)));

      // Verify all items were saved
      expect(repository.saveCallCount).toBe(5);
      expect(await repository.findAll()).toHaveLength(5);

      // Verify all events were published
      expect(eventBus.publishedEvents).toHaveLength(5);
      eventBus.publishedEvents.forEach(events => {
        expect(events).toHaveLength(1);
      });

      // Verify items can be retrieved correctly
      for (const command of commands) {
        const retrievedItem = await repository.find(StockItemId.from(command.id));
        expect(retrievedItem).toBeDefined();
        expect(retrievedItem!.name.value).toBe(command.name);
        expect(retrievedItem!.quantity.value).toBe(command.quantity);
      }
    });

    it('should maintain data consistency across operations', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Consistency Test Item',
        100
      );

      await handler.execute(command);

      // Retrieve the item and verify consistency
      const retrievedItem = await repository.find(StockItemId.from(command.id));
      expect(retrievedItem).toBeDefined();

      const savedItem = repository.savedItem!;
      expect(retrievedItem!.id).toEqual(savedItem.id);
      expect(retrievedItem!.name).toEqual(savedItem.name);
      expect(retrievedItem!.quantity).toEqual(savedItem.quantity);

      // Verify event data consistency
      const publishedEvents = eventBus.publishedEvents[0];
      expect(publishedEvents[0].aggregateId).toEqual(savedItem.id);
    });
  });

  describe('boundary conditions', () => {
    it('should handle maximum allowed quantity', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Max Quantity Item',
        1000000000 // Maximum allowed
      );

      await handler.execute(command);

      const savedItem = repository.savedItem!;
      expect(savedItem.quantity.value).toBe(1000000000);
    });

    it('should handle minimum allowed quantity (zero)', async () => {
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        'Zero Quantity Item',
        0
      );

      await handler.execute(command);

      const savedItem = repository.savedItem!;
      expect(savedItem.quantity.value).toBe(0);
    });

    it('should handle very long product names', async () => {
      const longName = 'A'.repeat(100); // Use maximum allowed length (100 chars)
      const command = new AddStockCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        longName,
        10
      );

      await handler.execute(command);

      const savedItem = repository.savedItem!;
      expect(savedItem.name.value).toBe(longName);
    });

    it('should handle edge case UUIDs', async () => {
      const edgeCaseUuids = [
        '00000000-0000-4000-8000-000000000000',
        'FFFFFFFF-FFFF-4FFF-BFFF-FFFFFFFFFFFF'
      ];

      for (const uuid of edgeCaseUuids) {
        const command = new AddStockCommand(
          uuid,
          'Edge Case UUID Item',
          10
        );

        await handler.execute(command);

        const savedItem = repository.savedItem!;
        expect(savedItem.id.value).toBe(uuid);
      }
    });
  });
});

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { TypeOrmStockItemRepository } from '@/Contexts/Inventory/StockItem/infrastructure/persistence/TypeOrmStockItemRepository';
import { StockItem } from '@/Contexts/Inventory/StockItem/domain/StockItem';
import { StockItemId } from '@/Contexts/Inventory/StockItem/domain/StockItemId';
import { StockItemName } from '@/Contexts/Inventory/StockItem/domain/StockItemName';
import { Quantity } from '@/Contexts/Inventory/StockItem/domain/Quantity';
import { StockItemEntity } from '@/Contexts/Inventory/StockItem/infrastructure/persistence/StockItemEntity';
import { EventBus } from '@/Shared/domain/EventBus';
import { DomainEvent } from '@/Shared/domain/DomainEvent';

// Mock EventBus for testing
class MockEventBus implements EventBus {
  public publishedEvents: DomainEvent[][] = [];

  async publish(events: DomainEvent[]): Promise<void> {
    this.publishedEvents.push([...events]);
  }

  subscribe(event: any, handler: any): void {
    // Not needed for this test
  }

  unsubscribe(event: any, handler: any): void {
    // Not needed for this test
  }

  clear(): void {
    this.publishedEvents = [];
  }
}

describe('TypeOrmStockItemRepository Integration', () => {
  let dataSource: DataSource;
  let repository: TypeOrmStockItemRepository;
  let eventBus: MockEventBus;

  beforeAll(async () => {
    // Set up test database configuration
    process.env.NODE_ENV = 'test';
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_SQLITE_PATH = '.data/test.sqlite';

    // Import and initialize the data source
    const { AppDataSource } = await import('@/Shared/infrastructure/persistence/TypeOrmConfig');
    dataSource = AppDataSource;

    await dataSource.initialize();

    // Create repository instance
    eventBus = new MockEventBus();
    repository = new TypeOrmStockItemRepository(eventBus);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clear the main repository instead of using dataSource
    if (repository) {
      // Use the repository's clear method or recreate it
      const stockItemRepo = dataSource.getRepository('StockItemEntity');
      await stockItemRepo.clear();
      
      const packageRepo = dataSource.getRepository('PackageEntity');
      await packageRepo.clear();
    }
    eventBus.clear();
  });

  describe('repository initialization', () => {
    it('should initialize repository with database connection', () => {
      expect(dataSource.isInitialized).toBe(true);
      expect(repository).toBeDefined();
    });

    it('should have access to StockItemEntity repository', () => {
      const entityRepository = dataSource.getRepository(StockItemEntity);
      expect(entityRepository).toBeDefined();
    });

    it('should handle optional eventBus parameter', () => {
      const repositoryWithoutEventBus = new TypeOrmStockItemRepository();
      expect(repositoryWithoutEventBus).toBeDefined();
    });
  });

  describe('save operation', () => {
    it('should save and retrieve stock item', async () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('iPhone 15'),
        quantity: new Quantity(100)
      });

      await repository.save(stockItem);

      const retrieved = await repository.find(id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id.value).toBe(id.value);
      expect(retrieved!.name.value).toBe('iPhone 15');
      expect(retrieved!.quantity.value).toBe(100);
    });

    it('should save stock item with zero quantity', async () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Out of Stock Item'),
        quantity: new Quantity(0)
      });

      await repository.save(stockItem);

      const retrieved = await repository.find(id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.quantity.value).toBe(0);
    });

    it('should save stock item with large quantity', async () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Bulk Item'),
        quantity: new Quantity(1000000)
      });

      await repository.save(stockItem);

      const retrieved = await repository.find(id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.quantity.value).toBe(1000000);
    });

    it('should save stock item with special characters in name', async () => {
      const id = StockItemId.random();
      const name = 'iPhone 15 Pro Max (512GB) - Space Black';
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from(name),
        quantity: new Quantity(50)
      });

      await repository.save(stockItem);

      const retrieved = await repository.find(id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.name.value).toBe(name);
    });

    it('should publish domain events when saving', async () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Event Test Item'),
        quantity: new Quantity(10)
      });

      await repository.save(stockItem);

      expect(eventBus.publishedEvents).toHaveLength(1);
      expect(eventBus.publishedEvents[0]).toHaveLength(1);

      const publishedEvent = eventBus.publishedEvents[0][0];
      expect(publishedEvent.eventName()).toBe('inventory.stock_item.added');
      expect(publishedEvent.aggregateId.value).toBe(id.value);
    });

    it('should not publish events when eventBus is not provided', async () => {
      const repositoryWithoutEventBus = new TypeOrmStockItemRepository();
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('No Event Bus Item'),
        quantity: new Quantity(10)
      });

      await repositoryWithoutEventBus.save(stockItem);

      expect(eventBus.publishedEvents).toHaveLength(0); // Event bus from beforeEach is not used
    });
  });

  describe('find operation', () => {
    it('should find existing stock item by ID', async () => {
      const id = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Find Test Item'),
        quantity: new Quantity(25)
      });

      await repository.save(stockItem);

      const found = await repository.find(id);
      expect(found).toBeDefined();
      expect(found!.id.value).toBe(id.value);
      expect(found!.name.value).toBe('Find Test Item');
      expect(found!.quantity.value).toBe(25);
    });

    it('should return null for non-existing stock item', async () => {
      const nonExistingId = StockItemId.random();

      const found = await repository.find(nonExistingId);
      expect(found).toBeNull();
    });

    it('should find stock item after multiple saves', async () => {
      const id1 = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const id2 = StockItemId.from('660e8400-e29b-41d4-a716-446655440000');

      const stockItem1 = StockItem.add({
        id: id1,
        name: StockItemName.from('First Item'),
        quantity: new Quantity(10)
      });

      const stockItem2 = StockItem.add({
        id: id2,
        name: StockItemName.from('Second Item'),
        quantity: new Quantity(20)
      });

      await repository.save(stockItem1);
      await repository.save(stockItem2);

      const found1 = await repository.find(id1);
      const found2 = await repository.find(id2);

      expect(found1).toBeDefined();
      expect(found1!.name.value).toBe('First Item');

      expect(found2).toBeDefined();
      expect(found2!.name.value).toBe('Second Item');
    });
  });

  describe('findAll operation', () => {
    it('should return empty array when no items exist', async () => {
      const allItems = await repository.findAll();
      expect(allItems).toHaveLength(0);
    });

    it('should return all saved stock items', async () => {
      const stockItems = [
        StockItem.add({
          id: StockItemId.from('550e8400-e29b-41d4-a716-446655440000'),
          name: StockItemName.from('Item 1'),
          quantity: new Quantity(10)
        }),
        StockItem.add({
          id: StockItemId.from('660e8400-e29b-41d4-a716-446655440000'),
          name: StockItemName.from('Item 2'),
          quantity: new Quantity(20)
        }),
        StockItem.add({
          id: StockItemId.from('770e8400-e29b-41d4-a716-446655440000'),
          name: StockItemName.from('Item 3'),
          quantity: new Quantity(30)
        })
      ];

      for (const item of stockItems) {
        await repository.save(item);
      }

      const allItems = await repository.findAll();
      expect(allItems).toHaveLength(3);

      // Items should be returned in insertion order for SQLite
      expect(allItems[0].name.value).toBe('Item 1');
      expect(allItems[1].name.value).toBe('Item 2');
      expect(allItems[2].name.value).toBe('Item 3');
    });

    it('should return items with correct quantities and names', async () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Test Item'),
        quantity: new Quantity(42)
      });

      await repository.save(stockItem);

      const allItems = await repository.findAll();
      expect(allItems).toHaveLength(1);

      const retrievedItem = allItems[0];
      expect(retrievedItem.id.value).toBe(id.value);
      expect(retrievedItem.name.value).toBe('Test Item');
      expect(retrievedItem.quantity.value).toBe(42);
    });
  });

  describe('delete operation', () => {
    it('should delete existing stock item', async () => {
      const id = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      
      // Make sure we're starting with a clean state
      try {
        await repository.delete(id); // Delete if exists
      } catch (error) {
        // Ignore if it doesn't exist
      }
      
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('To Be Deleted'),
        quantity: new Quantity(10)
      });

      await repository.save(stockItem);

      // Verify item exists
      const foundBeforeDelete = await repository.find(id);
      expect(foundBeforeDelete).toBeDefined();

      // Delete the item
      await repository.delete(id);

      // Verify item no longer exists
      const foundAfterDelete = await repository.find(id);
      expect(foundAfterDelete).toBeNull();
    });

    it('should delete item and update findAll results', async () => {
      const id1 = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const id2 = StockItemId.from('660e8400-e29b-41d4-a716-446655440000');

      await repository.save(StockItem.add({
        id: id1,
        name: StockItemName.from('Item 1'),
        quantity: new Quantity(10)
      }));

      await repository.save(StockItem.add({
        id: id2,
        name: StockItemName.from('Item 2'),
        quantity: new Quantity(20)
      }));

      // Verify both items exist
      let allItems = await repository.findAll();
      expect(allItems).toHaveLength(2);

      // Delete first item
      await repository.delete(id1);

      // Should now have only one item
      allItems = await repository.findAll();
      expect(allItems).toHaveLength(1);
      expect(allItems[0].name.value).toBe('Item 2');
    });
  });

  describe('data consistency', () => {
    it('should maintain data consistency between save and find operations', async () => {
      const originalData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Consistency Test Item',
        quantity: 100
      };

      const id = StockItemId.from(originalData.id);
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from(originalData.name),
        quantity: new Quantity(originalData.quantity)
      });

      await repository.save(stockItem);

      const retrieved = await repository.find(id);
      expect(retrieved).toBeDefined();

      // Compare all fields
      expect(retrieved!.id.value).toBe(originalData.id);
      expect(retrieved!.name.value).toBe(originalData.name);
      expect(retrieved!.quantity.value).toBe(originalData.quantity);

      // Ensure objects are different instances but equal
      expect(retrieved!.id).not.toBe(stockItem.id);
      expect(retrieved!.name).not.toBe(stockItem.name);
      expect(retrieved!.quantity).not.toBe(stockItem.quantity);

      expect(retrieved!.id.equals(stockItem.id)).toBe(true);
      expect(retrieved!.name.equals(stockItem.name)).toBe(true);
      expect(retrieved!.quantity.equals(stockItem.quantity)).toBe(true);
    });

    it('should handle concurrent-like save operations', async () => {
      const items = [
        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Concurrent Item 1', quantity: 10 },
        { id: '660e8400-e29b-41d4-a716-446655440000', name: 'Concurrent Item 2', quantity: 20 },
        { id: '770e8400-e29b-41d4-a716-446655440000', name: 'Concurrent Item 3', quantity: 30 },
        { id: '880e8400-e29b-41d4-a716-446655440000', name: 'Concurrent Item 4', quantity: 40 },
        { id: '990e8400-e29b-41d4-a716-446655440000', name: 'Concurrent Item 5', quantity: 50 }
      ];

      // Save all items concurrently
      const savePromises = items.map(item =>
        repository.save(StockItem.add({
          id: StockItemId.from(item.id),
          name: StockItemName.from(item.name),
          quantity: new Quantity(item.quantity)
        }))
      );

      await Promise.all(savePromises);

      // Verify all items were saved correctly
      const allItems = await repository.findAll();
      expect(allItems).toHaveLength(5);

      // Verify each item can be found individually
      for (const item of items) {
        const found = await repository.find(StockItemId.from(item.id));
        expect(found).toBeDefined();
        expect(found!.name.value).toBe(item.name);
        expect(found!.quantity.value).toBe(item.quantity);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle stock item with minimum values', async () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Min Values Item'),
        quantity: new Quantity(0) // Minimum quantity
      });

      await repository.save(stockItem);

      const retrieved = await repository.find(id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.quantity.value).toBe(0);
    });

    it('should handle stock item with maximum quantity', async () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Max Quantity Item'),
        quantity: new Quantity(1000000000) // Maximum quantity
      });

      await repository.save(stockItem);

      const retrieved = await repository.find(id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.quantity.value).toBe(1000000000);
    });

    it('should handle very long product names', async () => {
      const id = StockItemId.random();
      const longName = 'A'.repeat(100); // 100 character name
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from(longName),
        quantity: new Quantity(10)
      });

      await repository.save(stockItem);

      const retrieved = await repository.find(id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.name.value).toBe(longName);
    });

    it('should handle special UUID formats', async () => {
      const edgeCaseUuids = [
        '00000000-0000-4000-8000-000000000000',
        'FFFFFFFF-FFFF-4FFF-BFFF-FFFFFFFFFFFF'
      ];

      for (const uuid of edgeCaseUuids) {
        const id = StockItemId.from(uuid);
        const stockItem = StockItem.add({
          id,
          name: StockItemName.from('Edge Case UUID Item'),
          quantity: new Quantity(10)
        });

        await repository.save(stockItem);

        const retrieved = await repository.find(id);
        expect(retrieved).toBeDefined();
        expect(retrieved!.id.value).toBe(uuid);
      }
    });

    it('should handle database errors gracefully', async () => {
      const errorRepository = new TypeOrmStockItemRepository(eventBus);
      
      // Mock the repository's save method to throw an error
      const originalSave = (errorRepository as any).repository.save;
      (errorRepository as any).repository.save = async () => {
        throw new Error('Database connection failed');
      };

      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Error Test Item'),
        quantity: new Quantity(10)
      });

      await expect(errorRepository.save(stockItem)).rejects.toThrow('Database connection failed');
      
      // Restore original method
      (errorRepository as any).repository.save = originalSave;
    });
  });

  describe('event publishing integration', () => {
    it('should publish correct events when saving stock items', async () => {
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Event Publishing Test'),
        quantity: new Quantity(25)
      });

      await repository.save(stockItem);

      expect(eventBus.publishedEvents).toHaveLength(1);
      const publishedEvents = eventBus.publishedEvents[0];
      expect(publishedEvents).toHaveLength(1);

      const event = publishedEvents[0];
      expect(event.eventName()).toBe('inventory.stock_item.added');
      expect(event.aggregateId.value).toBe(id.value);

      // Verify event payload
      const eventPrimitives = event.toPrimitives();
      expect(eventPrimitives.name).toBe('Event Publishing Test');
      expect(eventPrimitives.quantity).toBe(25);
    });

    it('should not fail when eventBus publish throws error', async () => {
      const errorEventBus = new MockEventBus();
      errorEventBus.publish = async () => {
        throw new Error('Event bus error');
      };

      // Create repository with error-throwing event bus
      const errorRepository = new TypeOrmStockItemRepository(errorEventBus);
      const id = StockItemId.random();
      const stockItem = StockItem.add({
        id,
        name: StockItemName.from('Event Bus Error Test'),
        quantity: new Quantity(10)
      });

      // Should still save successfully even if event publishing fails
      await errorRepository.save(stockItem);

      // Verify the item was saved using the same repository instance
      const retrieved = await errorRepository.find(id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.name.value).toBe('Event Bus Error Test');
    });
  });

  describe('performance and stress tests', () => {
    it('should handle large number of stock items', async () => {
      const numberOfItems = 100;
      const items = [];

      for (let i = 0; i < numberOfItems; i++) {
        const id = StockItemId.random();
        const stockItem = StockItem.add({
          id,
          name: StockItemName.from(`Bulk Item ${i}`),
          quantity: new Quantity(i * 10)
        });
        items.push(stockItem);
      }

      // Save all items
      for (const item of items) {
        await repository.save(item);
      }

      // Verify all items were saved
      const allItems = await repository.findAll();
      expect(allItems).toHaveLength(numberOfItems);

      // Verify a few random items
      const randomIndex = Math.floor(Math.random() * numberOfItems);
      const randomItem = items[randomIndex];
      const found = await repository.find(randomItem.id);
      expect(found).toBeDefined();
      expect(found!.name.value).toBe(randomItem.name.value);
      expect(found!.quantity.value).toBe(randomItem.quantity.value);
    });

    it('should handle rapid save and find operations', async () => {
      const operations = [];

      for (let i = 0; i < 50; i++) {
        const id = StockItemId.random();
        const stockItem = StockItem.add({
          id,
          name: StockItemName.from(`Rapid Item ${i}`),
          quantity: new Quantity(i)
        });

        operations.push(
          repository.save(stockItem).then(() => repository.find(id))
        );
      }

      const results = await Promise.all(operations);

      // All find operations should return valid items
      results.forEach((found, index) => {
        expect(found).toBeDefined();
        expect(found!.name.value).toBe(`Rapid Item ${index}`);
        expect(found!.quantity.value).toBe(index);
      });
    });
  });
});

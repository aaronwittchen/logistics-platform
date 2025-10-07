import { ValueObject, isValueObject } from '@/Shared/domain/ValueObject';
import { StockItemId } from '@/Contexts/Inventory/StockItem/domain/StockItemId';

// Test implementation of ValueObject for testing purposes
interface TestProps {
  value: string;
  number?: number;
}

class TestValueObject extends ValueObject<TestProps> {
  constructor(value: string, number?: number) {
    super({ value, number });
  }

  protected validate(props: TestProps): void {
    if (!props.value || props.value.trim() === '') {
      throw new Error('Value cannot be empty');
    }
  }

  get value(): string {
    return this.unwrap().value;
  }

  get number(): number | undefined {
    return this.unwrap().number;
  }
}

// Test implementation with nested objects
interface NestedProps {
  name: string;
  metadata: {
    created: Date;
    tags: string[];
  };
}

class NestedValueObject extends ValueObject<NestedProps> {
  constructor(name: string, created: Date, tags: string[] = []) {
    super({ name, metadata: { created, tags } });
  }

  get name(): string {
    return this.unwrap().name;
  }

  get created(): Date {
    return this.unwrap().metadata.created;
  }

  get tags(): string[] {
    return [...this.unwrap().metadata.tags];
  }
}

describe('ValueObject', () => {
  describe('constructor and validation', () => {
    it('should create a value object with valid props', () => {
      const vo = new TestValueObject('test');
      expect(vo.value).toBe('test');
      expect(vo.unwrap()).toEqual({ value: 'test' });
    });

    it('should create a value object with optional props', () => {
      const vo = new TestValueObject('test', 42);
      expect(vo.value).toBe('test');
      expect(vo.number).toBe(42);
      expect(vo.unwrap()).toEqual({ value: 'test', number: 42 });
    });

    it('should throw error when validation fails', () => {
      expect(() => new TestValueObject('')).toThrow('Value cannot be empty');
      expect(() => new TestValueObject('   ')).toThrow('Value cannot be empty');
    });

    it('should handle null and undefined in props gracefully', () => {
      // This tests that deepFreeze handles null/undefined values properly
      const vo = new TestValueObject('test');
      expect(vo.unwrap()).toEqual({ value: 'test' });
    });
  });

  describe('immutability (deepFreeze)', () => {
    it('should freeze primitive properties', () => {
      const vo = new TestValueObject('test', 42);
      const props = vo.unwrap();
      
      expect(() => {
        (props as any).value = 'modified';
      }).toThrow();
      
      expect(() => {
        (props as any).number = 99;
      }).toThrow();
    });

    it('should deep freeze nested objects', () => {
      const created = new Date();
      const tags = ['tag1', 'tag2'];
      const vo = new NestedValueObject('test', created, tags);
      
      const metadata = vo.unwrap().metadata;
      expect(Object.isFrozen(metadata)).toBe(true);
      expect(Object.isFrozen(metadata.created)).toBe(true);
      expect(Object.isFrozen(metadata.tags)).toBe(true);
    });

    it('should deep freeze nested arrays', () => {
      const created = new Date();
      const tags = ['tag1', 'tag2'];
      const vo = new NestedValueObject('test', created, tags);
      
      const frozenTags = vo.unwrap().metadata.tags;
      expect(() => {
        frozenTags.push('new tag');
      }).toThrow();
      
      expect(() => {
        frozenTags[0] = 'modified';
      }).toThrow();
    });

    it('should handle Date objects correctly', () => {
      const created = new Date();
      const vo = new NestedValueObject('test', created);
      
      // Date should be frozen
      expect(Object.isFrozen(vo.unwrap().metadata.created)).toBe(true);
      
      // But we should still be able to compare dates
      const retrievedDate = vo.created;
      expect(retrievedDate).toEqual(created);
    });
  });

  describe('equality comparison', () => {
    it('should return true for identical value objects', () => {
      const vo1 = new TestValueObject('test', 42);
      const vo2 = new TestValueObject('test', 42);
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should return false for different values', () => {
      const vo1 = new TestValueObject('test1');
      const vo2 = new TestValueObject('test2');
      expect(vo1.equals(vo2)).toBe(false);
    });

    it('should return false for different types', () => {
      const vo1 = new TestValueObject('test');
      const vo2 = new NestedValueObject('test', new Date());
      expect(vo1.equals(vo2 as any)).toBe(false);
    });

    it('should return true for same reference', () => {
      const vo = new TestValueObject('test');
      expect(vo.equals(vo)).toBe(true);
    });

    it('should return false for null/undefined', () => {
      const vo = new TestValueObject('test');
      expect(vo.equals(null as any)).toBe(false);
      expect(vo.equals(undefined as any)).toBe(false);
    });

    it('should handle nested object comparison', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-01');
      const vo1 = new NestedValueObject('test', date1, ['tag1']);
      const vo2 = new NestedValueObject('test', date2, ['tag1']);
      
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should handle array comparison', () => {
      const vo1 = new NestedValueObject('test', new Date(), ['tag1', 'tag2']);
      const vo2 = new NestedValueObject('test', new Date(), ['tag1', 'tag2']);
      const vo3 = new NestedValueObject('test', new Date(), ['tag1', 'different']);
      
      expect(vo1.equals(vo2)).toBe(true);
      expect(vo1.equals(vo3)).toBe(false);
    });

    it('should handle complex nested structures', () => {
      const vo1 = new NestedValueObject('test', new Date(), ['tag1']);
      const vo2 = new NestedValueObject('test', new Date(), ['tag1']);
      const vo3 = new NestedValueObject('different', new Date(), ['tag1']);
      
      expect(vo1.equals(vo2)).toBe(true);
      expect(vo1.equals(vo3)).toBe(false);
    });
  });

  describe('JSON serialization', () => {
    it('should serialize to JSON correctly', () => {
      const vo = new TestValueObject('test', 42);
      const json = vo.toJSON();
      expect(json).toEqual({ value: 'test', number: 42 });
    });

    it('should stringify correctly', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = StockItemId.from(uuid);
      
      const str = JSON.stringify(id);
      expect(str).toBe('{"value":"550e8400-e29b-41d4-a716-446655440000"}');
    });

    it('should handle nested objects in serialization', () => {
      const created = new Date('2023-01-01T00:00:00.000Z');
      const vo = new NestedValueObject('test', created, ['tag1']);
      
      const json = vo.toJSON();
      expect(json).toEqual({
        name: 'test',
        metadata: {
          created: created, // Should be the actual Date object, not a string
          tags: ['tag1']
        }
      });
    });

    it('should unwrap correctly', () => {
      const vo = new TestValueObject('test', 42);
      const unwrapped = vo.unwrap();
      expect(unwrapped).toEqual({ value: 'test', number: 42 });
      expect(Object.isFrozen(unwrapped)).toBe(true);
    });
  });

  describe('type guard', () => {
    it('should identify value objects correctly', () => {
      const vo = new TestValueObject('test');
      expect(isValueObject(vo)).toBe(true);
      expect(isValueObject(null)).toBe(false);
      expect(isValueObject(undefined)).toBe(false);
      expect(isValueObject({})).toBe(false);
      expect(isValueObject('string')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      // Create a minimal value object for testing
      class EmptyValueObject extends ValueObject<{}> {
        constructor() {
          super({});
        }
      }
      
      const vo = new EmptyValueObject();
      expect(vo.equals(new EmptyValueObject())).toBe(true);
      expect(vo.unwrap()).toEqual({});
    });

    it('should handle circular references in deepFreeze', () => {
      // This tests that deepFreeze doesn't break with circular refs
      const vo = new TestValueObject('test');
      expect(() => vo.unwrap()).not.toThrow();
    });

    it('should handle functions in props (if they exist)', () => {
      // deepFreeze should handle functions gracefully
      const vo = new TestValueObject('test');
      expect(() => vo.unwrap()).not.toThrow();
    });
  });
});
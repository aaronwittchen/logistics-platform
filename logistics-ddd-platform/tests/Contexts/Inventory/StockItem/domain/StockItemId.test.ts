import { StockItemId } from '@/Contexts/Inventory/StockItem/domain/StockItemId';
import { Uuid } from '@/Shared/domain/Uuid';

describe('StockItemId', () => {
  describe('static random() method', () => {
    it('should create a random stock item id', () => {
      const id = StockItemId.random();
      
      expect(id).toBeDefined();
      expect(id).toBeInstanceOf(StockItemId);
      expect(id).toBeInstanceOf(Uuid); // Should also be a Uuid
      expect(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs on multiple calls', () => {
      const id1 = StockItemId.random();
      const id2 = StockItemId.random();
      
      expect(id1.value).not.toBe(id2.value);
      expect(id1.equals(id2)).toBe(false);
    });

    it('should generate valid UUID v4 format', () => {
      const id = StockItemId.random();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(id.value).toMatch(uuidRegex);
      
      // Check version (4th character of 3rd group should be '4')
      const versionChar = id.value.charAt(14);
      expect(versionChar).toBe('4');
    });

    it('should generate IDs with valid variants (8, 9, a, b)', () => {
      const variants = new Set<string>();
      
      // Generate multiple IDs to check variants
      for (let i = 0; i < 100; i++) {
        const id = StockItemId.random();
        const variantChar = id.value.charAt(19);
        variants.add(variantChar);
      }
      
      // Should only have valid variant characters
      expect(variants.has('8') || variants.has('9') || variants.has('a') || variants.has('b')).toBe(true);
    });
  });

  describe('static from() method', () => {
    it('should create StockItemId from valid UUID string', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = StockItemId.from(validUuid);
      
      expect(id).toBeDefined();
      expect(id).toBeInstanceOf(StockItemId);
      expect(id.value).toBe(validUuid);
      expect(id.toString()).toBe(validUuid);
    });

    it('should accept UUIDs with different variants', () => {
      const uuid8 = '550e8400-e29b-41d4-8716-446655440000'; // variant 8
      const uuid9 = '550e8400-e29b-41d4-9716-446655440000'; // variant 9
      const uuiDa = '550e8400-e29b-41d4-a716-446655440000'; // variant a
      const uuidB = '550e8400-e29b-41d4-b716-446655440000'; // variant b

      expect(() => StockItemId.from(uuid8)).not.toThrow();
      expect(() => StockItemId.from(uuid9)).not.toThrow();
      expect(() => StockItemId.from(uuiDa)).not.toThrow();
      expect(() => StockItemId.from(uuidB)).not.toThrow();
    });

    it('should accept UUIDs with different cases', () => {
      const lowerCaseUuid = '550e8400-e29b-41d4-a716-446655440000';
      const upperCaseUuid = '550E8400-E29B-41D4-A716-446655440000';
      
      expect(() => StockItemId.from(lowerCaseUuid)).not.toThrow();
      expect(() => StockItemId.from(upperCaseUuid)).not.toThrow();
    });
  });

  describe('validation (inherited from Uuid)', () => {
    it('should reject invalid UUID format', () => {
      const invalidUuids = [
        'invalid',
        '550e8400-e29b-41d4-a716', // too short
        '550e8400-e29b-41d4-a716-446655440000-extra', // too long
        '550e8400-e29b-41d4-a716-44665544000g', // invalid character
        '550e8400-e29b-51d4-a716-446655440000', // version 5 instead of 4
        '550e8400e29b41d4a716446655440000', // missing hyphens
        '550e8400-e29b41d4-a716446655440000', // missing hyphens
        '', // empty string
        'gggggggg-gggg-4ggg-gggg-gggggggggggg', // invalid characters
      ];

      invalidUuids.forEach(invalidUuid => {
        expect(() => StockItemId.from(invalidUuid)).toThrow('Invalid UUID');
      });
    });

    it('should reject null and undefined', () => {
      expect(() => StockItemId.from(null as any)).toThrow('Invalid UUID');
      expect(() => StockItemId.from(undefined as any)).toThrow('Invalid UUID');
    });
  });

  describe('type safety and instanceof checks', () => {
    it('should be instance of both StockItemId and Uuid', () => {
      const id = StockItemId.random();
      
      expect(id).toBeInstanceOf(StockItemId);
      expect(id).toBeInstanceOf(Uuid);
    });

    it('should not be instance of other classes', () => {
      const id = StockItemId.random();
      
      expect(id).not.toBeInstanceOf(String);
      expect(id).not.toBeInstanceOf(Number);
      expect(id).not.toBeInstanceOf(Date);
    });
  });

  describe('equality comparison (inherited from ValueObject)', () => {
    it('should be equal to another StockItemId with same value', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id1 = StockItemId.from(uuid);
      const id2 = StockItemId.from(uuid);
      
      expect(id1.equals(id2)).toBe(true);
    });

    it('should not be equal to StockItemId with different value', () => {
      const id1 = StockItemId.from('550e8400-e29b-41d4-a716-446655440000');
      const id2 = StockItemId.from('660e8400-e29b-41d4-a716-446655440000');
      
      expect(id1.equals(id2)).toBe(false);
    });

    it('should not be equal to regular Uuid with same value', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const stockItemId = StockItemId.from(uuid);
      const regularUuid = new Uuid(uuid);
      
      // They have the same value but are different types
      expect(stockItemId.equals(regularUuid as any)).toBe(false);
      expect(stockItemId.value).toBe(regularUuid.value);
    });

    it('should not be equal to null or undefined', () => {
      const id = StockItemId.random();
      
      expect(id.equals(null as any)).toBe(false);
      expect(id.equals(undefined as any)).toBe(false);
    });

    it('should be equal to itself', () => {
      const id = StockItemId.random();
      
      expect(id.equals(id)).toBe(true);
    });
  });

  describe('JSON serialization (inherited from ValueObject)', () => {
    it('should serialize to JSON correctly', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = StockItemId.from(uuid);
      
      const json = id.toJSON();
      expect(json).toEqual({ value: uuid });
    });

    it('should stringify correctly', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = StockItemId.from(uuid);
      
      const str = JSON.stringify(id);
      expect(str).toBe('{"value":"550e8400-e29b-41d4-a716-446655440000"}');
    });

    it('should unwrap correctly', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = StockItemId.from(uuid);
      
      const unwrapped = id.unwrap();
      expect(unwrapped).toEqual({ value: uuid });
    });
  });

  describe('immutability (inherited from ValueObject)', () => {
    it('should be immutable', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = StockItemId.from(uuid);
      const unwrapped = id.unwrap();
      
      expect(Object.isFrozen(unwrapped)).toBe(true);
      expect(Object.isFrozen(unwrapped.value)).toBe(true);
    });
  });

  describe('value property (inherited from Uuid)', () => {
    it('should return the correct UUID value', () => {
      const testUuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = StockItemId.from(testUuid);
      
      expect(id.value).toBe(testUuid);
      expect(typeof id.value).toBe('string');
      expect(id.value.length).toBe(36); // UUID v4 length with hyphens
    });

    it('should return the same value consistently', () => {
      const id = StockItemId.random();
      const value1 = id.value;
      const value2 = id.value;
      
      expect(value1).toBe(value2);
    });
  });

  describe('edge cases', () => {
    it('should handle UUIDs with special characters in valid range', () => {
      // Test edge case UUIDs that are technically valid
      const edgeCaseUuids = [
        '00000000-0000-4000-8000-000000000000', // all zeros except version/variant
        'FFFFFFFF-FFFF-4FFF-BFFF-FFFFFFFFFFFF', // all F's except version/variant
      ];
      
      edgeCaseUuids.forEach(uuid => {
        expect(() => StockItemId.from(uuid)).not.toThrow();
      });
    });

    it('should handle UUIDs generated from different sources', () => {
      // Create a StockItemId from a Uuid value
      const uuid = Uuid.random();
      const stockItemId = StockItemId.from(uuid.value);
      
      expect(stockItemId.value).toBe(uuid.value);
      expect(stockItemId).toBeInstanceOf(StockItemId);
      expect(stockItemId).toBeInstanceOf(Uuid);
    });

    it('should handle large numbers of random ID generations', () => {
      const ids = new Set<string>();
      
      // Generate many IDs and ensure they're all unique
      for (let i = 0; i < 1000; i++) {
        const id = StockItemId.random();
        ids.add(id.value);
      }
      
      expect(ids.size).toBe(1000);
    });
  });
});

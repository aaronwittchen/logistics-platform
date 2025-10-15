import { Uuid } from '@/Shared/domain/Uuid';

describe('Uuid', () => {
  describe('constructor validation', () => {
    it('should create a valid UUID from a proper UUID v4 string', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuid = new Uuid(validUuid);

      expect(uuid).toBeDefined();
      expect(uuid.value).toBe(validUuid);
    });

    it('should accept UUIDs with different variants (8, 9, a, b)', () => {
      const uuid8 = '550e8400-e29b-41d4-8716-446655440000'; // variant 8
      const uuid9 = '550e8400-e29b-41d4-9716-446655440000'; // variant 9
      const uuiDa = '550e8400-e29b-41d4-a716-446655440000'; // variant a
      const uuidB = '550e8400-e29b-41d4-b716-446655440000'; // variant b

      expect(() => new Uuid(uuid8)).not.toThrow();
      expect(() => new Uuid(uuid9)).not.toThrow();
      expect(() => new Uuid(uuiDa)).not.toThrow();
      expect(() => new Uuid(uuidB)).not.toThrow();
    });

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
        expect(() => new Uuid(invalidUuid)).toThrow('Invalid UUID');
      });
    });

    it('should reject null and undefined', () => {
      expect(() => new Uuid(null as any)).toThrow('Invalid UUID');
      expect(() => new Uuid(undefined as any)).toThrow('Invalid UUID');
    });
  });

  describe('random UUID generation', () => {
    it('should generate a valid random UUID', () => {
      const uuid1 = Uuid.random();
      const uuid2 = Uuid.random();

      expect(uuid1).toBeDefined();
      expect(uuid2).toBeDefined();
      expect(uuid1.value).not.toBe(uuid2.value); // Should be different
      expect(uuid1.equals(uuid2)).toBe(false); // Should not be equal

      // Verify it's a valid UUID format
      expect(uuid1.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate UUIDs with version 4', () => {
      const uuid = Uuid.random();
      const versionChar = uuid.value.charAt(14);
      expect(versionChar).toBe('4');
    });

    it('should generate UUIDs with valid variants (8, 9, a, b)', () => {
      const variants = new Set<string>();

      // Generate multiple UUIDs to check variants
      for (let i = 0; i < 100; i++) {
        const uuid = Uuid.random();
        const variantChar = uuid.value.charAt(19);
        variants.add(variantChar);
      }

      // Should only have valid variant characters
      expect(variants.has('8') || variants.has('9') || variants.has('a') || variants.has('b')).toBe(true);
    });
  });

  describe('value getter', () => {
    it('should return the correct UUID value', () => {
      const testUuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuid = new Uuid(testUuid);

      expect(uuid.value).toBe(testUuid);
      expect(typeof uuid.value).toBe('string');
      expect(uuid.value.length).toBe(36); // UUID v4 length with hyphens
    });
  });

  describe('static from method', () => {
    it('should create UUID from valid string using factory method', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuid = Uuid.from(validUuid);

      expect(uuid).toBeDefined();
      expect(uuid.value).toBe(validUuid);
    });

    it('should throw error for invalid UUID in factory method', () => {
      expect(() => Uuid.from('invalid')).toThrow('Invalid UUID');
    });
  });

  describe('equality comparison (inherited from ValueObject)', () => {
    it('should be equal to another UUID with same value', () => {
      const uuid1 = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const uuid2 = new Uuid('550e8400-e29b-41d4-a716-446655440000');

      expect(uuid1.equals(uuid2)).toBe(true);
    });

    it('should not be equal to UUID with different value', () => {
      const uuid1 = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const uuid2 = new Uuid('660e8400-e29b-41d4-a716-446655440000');

      expect(uuid1.equals(uuid2)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      const uuid = new Uuid('550e8400-e29b-41d4-a716-446655440000');

      expect(uuid.equals(null as any)).toBe(false);
      expect(uuid.equals(undefined as any)).toBe(false);
    });

    it('should be equal to itself', () => {
      const uuid = new Uuid('550e8400-e29b-41d4-a716-446655440000');

      expect(uuid.equals(uuid)).toBe(true);
    });
  });

  describe('JSON serialization (inherited from ValueObject)', () => {
    it('should serialize to JSON correctly', () => {
      const testUuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuid = new Uuid(testUuid);

      const json = uuid.toJSON();
      expect(json).toEqual({ value: testUuid });
    });

    it('should stringify correctly', () => {
      const testUuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuid = new Uuid(testUuid);

      const str = JSON.stringify(uuid);
      expect(str).toBe('{"value":"550e8400-e29b-41d4-a716-446655440000"}');
    });

    it('should unwrap correctly', () => {
      const testUuid = '550e8400-e29b-41d4-a716-446655440000';
      const uuid = new Uuid(testUuid);

      const unwrapped = uuid.unwrap();
      expect(unwrapped).toEqual({ value: testUuid });
    });
  });

  describe('immutability (inherited from ValueObject)', () => {
    it('should be immutable', () => {
      const uuid = new Uuid('550e8400-e29b-41d4-a716-446655440000');
      const unwrapped = uuid.unwrap();

      expect(Object.isFrozen(unwrapped)).toBe(true);
      expect(Object.isFrozen(unwrapped.value)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle UUIDs with different cases', () => {
      const lowerCaseUuid = '550e8400-e29b-41d4-a716-446655440000';
      const upperCaseUuid = '550E8400-E29B-41D4-A716-446655440000';

      expect(() => new Uuid(lowerCaseUuid)).not.toThrow();
      expect(() => new Uuid(upperCaseUuid)).not.toThrow();
    });

    it('should handle UUIDs generated by different systems', () => {
      // Test that our regex accepts UUIDs that might be generated differently
      // but still follow the v4 format
      const edgeCaseUuids = [
        '00000000-0000-4000-8000-000000000000', // all zeros except version/variant
        'FFFFFFFF-FFFF-4FFF-BFFF-FFFFFFFFFFFF', // all F's except version/variant
      ];

      edgeCaseUuids.forEach(uuid => {
        expect(() => new Uuid(uuid)).not.toThrow();
      });
    });
  });
});

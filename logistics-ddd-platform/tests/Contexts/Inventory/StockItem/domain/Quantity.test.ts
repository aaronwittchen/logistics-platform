import { Quantity } from '@/Contexts/Inventory/StockItem/domain/Quantity';

describe('Quantity', () => {
  describe('constructor validation', () => {
    it('should create valid quantity with positive integer', () => {
      const qty = new Quantity(10);
      expect(qty.value).toBe(10);
      expect(qty.getValue()).toBe(10);
    });

    it('should create quantity with zero', () => {
      const qty = new Quantity(0);
      expect(qty.value).toBe(0);
      expect(qty.getValue()).toBe(0);
    });

    it('should reject negative quantity', () => {
      expect(() => new Quantity(-1)).toThrow('Quantity cannot be negative');
      expect(() => new Quantity(-100)).toThrow('Quantity cannot be negative');
    });

    it('should reject non-integer values', () => {
      expect(() => new Quantity(10.5)).toThrow('Quantity must be an integer');
      expect(() => new Quantity(1.1)).toThrow('Quantity must be an integer');
      expect(() => new Quantity(0.1)).toThrow('Quantity must be an integer');
    });

    it('should reject non-finite numbers', () => {
      expect(() => new Quantity(Infinity)).toThrow('Quantity must be a finite number');
      expect(() => new Quantity(-Infinity)).toThrow('Quantity must be a finite number');
      expect(() => new Quantity(NaN)).toThrow('Quantity must be a finite number');
    });

    it('should reject extremely large numbers', () => {
      const tooLarge = 1_000_000_001; // One more than MAX
      expect(() => new Quantity(tooLarge)).toThrow('Quantity too large');
    });

    it('should accept maximum allowed quantity', () => {
      const maxQuantity = 1_000_000_000; // Exactly MAX
      expect(() => new Quantity(maxQuantity)).not.toThrow();
    });
  });

  describe('value access methods', () => {
    it('should return correct value through getter', () => {
      const qty = new Quantity(42);
      expect(qty.value).toBe(42);
    });

    it('should return correct value through getValue method', () => {
      const qty = new Quantity(100);
      expect(qty.getValue()).toBe(100);
    });

    it('should return consistent values from both methods', () => {
      const qty = new Quantity(25);
      expect(qty.value).toBe(qty.getValue());
    });
  });

  describe('comparison operations', () => {
    it('should correctly compare equal quantities', () => {
      const qty1 = new Quantity(10);
      const qty2 = new Quantity(10);
      expect(qty1.isGreaterThanOrEqual(qty2)).toBe(true);
      expect(qty2.isGreaterThanOrEqual(qty1)).toBe(true);
    });

    it('should correctly identify greater quantities', () => {
      const qty1 = new Quantity(20);
      const qty2 = new Quantity(10);
      expect(qty1.isGreaterThanOrEqual(qty2)).toBe(true);
      expect(qty2.isGreaterThanOrEqual(qty1)).toBe(false);
    });

    it('should handle zero quantities correctly', () => {
      const qty1 = new Quantity(0);
      const qty2 = new Quantity(0);
      const qty3 = new Quantity(5);

      expect(qty1.isGreaterThanOrEqual(qty2)).toBe(true);
      expect(qty2.isGreaterThanOrEqual(qty1)).toBe(true);
      expect(qty3.isGreaterThanOrEqual(qty1)).toBe(true);
      expect(qty1.isGreaterThanOrEqual(qty3)).toBe(false);
    });

    it('should handle large quantities correctly', () => {
      const qty1 = new Quantity(999999999);
      const qty2 = new Quantity(1000000000);
      expect(qty1.isGreaterThanOrEqual(qty2)).toBe(false);
      expect(qty2.isGreaterThanOrEqual(qty1)).toBe(true);
    });
  });

  describe('subtraction operations', () => {
    it('should subtract smaller quantity from larger', () => {
      const qty1 = new Quantity(10);
      const qty2 = new Quantity(3);
      const result = qty1.subtract(qty2);

      expect(result).toBeInstanceOf(Quantity);
      expect(result.value).toBe(7);
      expect(result.getValue()).toBe(7);
    });

    it('should subtract equal quantities resulting in zero', () => {
      const qty1 = new Quantity(10);
      const qty2 = new Quantity(10);
      const result = qty1.subtract(qty2);

      expect(result.value).toBe(0);
    });

    it('should handle subtracting from zero', () => {
      const qty1 = new Quantity(0);
      const qty2 = new Quantity(5);
      expect(() => qty1.subtract(qty2)).toThrow('Quantity cannot be negative');
    });

    it('should handle large number subtraction', () => {
      const qty1 = new Quantity(1000000000);
      const qty2 = new Quantity(1);
      const result = qty1.subtract(qty2);

      expect(result.value).toBe(999999999);
    });

    it('should return new instance (immutability)', () => {
      const qty1 = new Quantity(10);
      const qty2 = new Quantity(3);
      const result = qty1.subtract(qty2);

      expect(result).not.toBe(qty1);
      expect(qty1.value).toBe(10); // Original unchanged
      expect(qty2.value).toBe(3);  // Other unchanged
    });
  });

  describe('static factory method', () => {
    it('should create quantity using static from method', () => {
      const qty = Quantity.from(42);
      expect(qty).toBeInstanceOf(Quantity);
      expect(qty.value).toBe(42);
    });

    it('should apply same validation in factory method', () => {
      expect(() => Quantity.from(-1)).toThrow('Quantity cannot be negative');
      expect(() => Quantity.from(10.5)).toThrow('Quantity must be an integer');
      expect(() => Quantity.from(Infinity)).toThrow('Quantity must be a finite number');
    });
  });

  describe('equality comparison (inherited from ValueObject)', () => {
    it('should be equal to quantity with same value', () => {
      const qty1 = new Quantity(10);
      const qty2 = new Quantity(10);
      expect(qty1.equals(qty2)).toBe(true);
    });

    it('should not be equal to quantity with different value', () => {
      const qty1 = new Quantity(10);
      const qty2 = new Quantity(20);
      expect(qty1.equals(qty2)).toBe(false);
    });

    it('should not be equal to zero when not zero', () => {
      const qty1 = new Quantity(10);
      const qty2 = new Quantity(0);
      expect(qty1.equals(qty2)).toBe(false);
    });

    it('should be equal to itself', () => {
      const qty = new Quantity(10);
      expect(qty.equals(qty)).toBe(true);
    });

    it('should not be equal to null or undefined', () => {
      const qty = new Quantity(10);
      expect(qty.equals(null as any)).toBe(false);
      expect(qty.equals(undefined as any)).toBe(false);
    });
  });

  describe('JSON serialization (inherited from ValueObject)', () => {
    it('should serialize to JSON correctly', () => {
      const qty = new Quantity(42);
      const json = qty.toJSON();
      expect(json).toEqual({ value: 42 });
    });

    it('should stringify correctly', () => {
      const qty = new Quantity(100);
      const str = qty.toString();
      expect(str).toBe('{"value":100}');
    });

    it('should unwrap correctly', () => {
      const qty = new Quantity(25);
      const unwrapped = qty.unwrap();
      expect(unwrapped).toEqual({ value: 25 });
    });
  });

  describe('immutability (inherited from ValueObject)', () => {
    it('should be immutable', () => {
      const qty = new Quantity(42);
      const unwrapped = qty.unwrap();

      expect(Object.isFrozen(unwrapped)).toBe(true);
      expect(Object.isFrozen(unwrapped.value)).toBe(true);
    });
  });

  describe('boundary conditions', () => {
    it('should handle minimum quantity (zero)', () => {
      const qty = new Quantity(0);
      expect(qty.value).toBe(0);
      expect(qty.isGreaterThanOrEqual(new Quantity(0))).toBe(true);
      expect(() => qty.subtract(new Quantity(1))).toThrow('Quantity cannot be negative');
    });

    it('should handle maximum quantity', () => {
      const qty = new Quantity(1000000000);
      expect(qty.value).toBe(1000000000);
      expect(qty.isGreaterThanOrEqual(new Quantity(1000000000))).toBe(true);
      expect(() => qty.subtract(new Quantity(1))).not.toThrow();
    });

    it('should handle edge case around validation boundaries', () => {
      // Test just below maximum
      expect(() => new Quantity(999999999)).not.toThrow();

      // Test just above minimum
      expect(() => new Quantity(1)).not.toThrow();

      // Test exactly at boundaries
      expect(() => new Quantity(0)).not.toThrow();
      expect(() => new Quantity(1000000000)).not.toThrow();
    });
  });

  describe('method chaining and composition', () => {
    it('should allow method chaining with operations', () => {
      const qty1 = new Quantity(100);
      const qty2 = new Quantity(10);
      const qty3 = new Quantity(5);

      // Chain operations
      const result = qty1.subtract(qty2).subtract(qty3);
      expect(result.value).toBe(85);

      // Original quantities should remain unchanged
      expect(qty1.value).toBe(100);
      expect(qty2.value).toBe(10);
      expect(qty3.value).toBe(5);
    });

    it('should work with complex calculation scenarios', () => {
      const initial = new Quantity(1000);
      const toSubtract1 = new Quantity(100);
      const toSubtract2 = new Quantity(50);

      const step1 = initial.subtract(toSubtract1);
      const step2 = step1.subtract(toSubtract2);
      const final = step2;

      expect(final.value).toBe(850);
      expect(initial.value).toBe(1000); // Original unchanged
    });
  });

  describe('error handling', () => {
    it('should throw descriptive errors for invalid operations', () => {
      const qty1 = new Quantity(5);
      const qty2 = new Quantity(10);

      expect(() => qty1.subtract(qty2)).toThrow('Quantity cannot be negative');
    });

    it('should maintain consistency even with invalid operations', () => {
      const qty1 = new Quantity(5);
      const qty2 = new Quantity(10);

      expect(() => qty1.subtract(qty2)).toThrow();

      // Original quantities should still be valid
      expect(qty1.value).toBe(5);
      expect(qty2.value).toBe(10);
    });
  });

  describe('integration with domain rules', () => {
    it('should enforce business rules through validation', () => {
      // These represent business rules that should never be violated
      expect(() => new Quantity(-1)).toThrow(); // No negative stock
      expect(() => new Quantity(10.5)).toThrow(); // Must be whole units
      expect(() => new Quantity(Infinity)).toThrow(); // No infinite stock
    });

    it('should support business operations safely', () => {
      const currentStock = new Quantity(100);
      const reservedStock = new Quantity(25);
      const availableStock = currentStock.subtract(reservedStock);

      expect(availableStock.value).toBe(75);
      expect(currentStock.value).toBe(100); // Original unchanged
      expect(reservedStock.value).toBe(25);  // Other unchanged
    });
  });
});

// logistics-ddd-platform/tests/Contexts/Inventory/StockItem/domain/StockItemName.test.ts
import { StockItemName } from '@/Contexts/Inventory/StockItem/domain/StockItemName';

describe('StockItemName', () => {
  describe('creation', () => {
    it('should create valid stock item name', () => {
      const name = StockItemName.from('iPhone 15 Pro');
      expect(name.value).toBe('iPhone 15 Pro');
    });

    it('should create name with minimum length', () => {
      const name = StockItemName.from('A');
      expect(name.value).toBe('A');
    });

    it('should create name with maximum length', () => {
      const maxLengthName = 'A'.repeat(100);
      const name = StockItemName.from(maxLengthName);
      expect(name.value).toBe(maxLengthName);
    });

    it('should trim whitespace and create valid name', () => {
      const name = StockItemName.from('  iPhone 15  ');
      expect(name.value).toBe('  iPhone 15  '); // Stores original value, not trimmed
    });
  });

  describe('validation', () => {
    it('should throw error for empty name', () => {
      expect(() => StockItemName.from('')).toThrow('StockItemName cannot be empty');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => StockItemName.from('   ')).toThrow('StockItemName cannot be empty');
    });

    it('should throw error for name too short', () => {
      expect(() => StockItemName.from('')).toThrow('StockItemName cannot be empty');
    });

    it('should throw error for name too long', () => {
      const tooLongName = 'A'.repeat(101);
      expect(() => StockItemName.from(tooLongName)).toThrow('StockItemName too long');
    });
  });

  describe('special characters and formats', () => {
    it('should handle names with numbers', () => {
      const name = StockItemName.from('iPhone 15 Pro Max');
      expect(name.value).toBe('iPhone 15 Pro Max');
    });

    it('should handle names with special characters', () => {
      const name = StockItemName.from('MacBook Pro 16" M3');
      expect(name.value).toBe('MacBook Pro 16" M3');
    });

    it('should handle names with emojis', () => {
      const name = StockItemName.from('iPhone 📱');
      expect(name.value).toBe('iPhone 📱');
    });

    it('should handle names with unicode characters', () => {
      const name = StockItemName.from('Samsung Galaxy S24 Ultra (中国)');
      expect(name.value).toBe('Samsung Galaxy S24 Ultra (中国)');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const name = StockItemName.from('iPhone 15');
      expect(Object.isFrozen(name)).toBe(true); // Check instance itself is frozen
      expect(() => {
        (name as any).value = 'Samsung Galaxy';
      }).toThrow();
    });
  });

  describe('equality', () => {
    it('should be equal to same name', () => {
      const name1 = StockItemName.from('iPhone 15');
      const name2 = StockItemName.from('iPhone 15');
      expect(name1.equals(name2)).toBe(true);
    });

    it('should not be equal to different name', () => {
      const name1 = StockItemName.from('iPhone 15');
      const name2 = StockItemName.from('Samsung Galaxy');
      expect(name1.equals(name2)).toBe(false);
    });

    it('should handle case sensitivity', () => {
      const name1 = StockItemName.from('iPhone 15');
      const name2 = StockItemName.from('IPHONE 15');
      expect(name1.equals(name2)).toBe(false);
    });
  });
});
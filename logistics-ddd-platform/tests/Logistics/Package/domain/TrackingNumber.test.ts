// logistics-ddd-platform/tests/Contexts/Logistics/Package/domain/TrackingNumber.test.ts
import { TrackingNumber } from '@/Contexts/Logistics/Package/domain/TrackingNumber';

describe('TrackingNumber', () => {
  describe('creation', () => {
    it('should create valid tracking number', () => {
      const trackingNumber = TrackingNumber.from('ABCD123456');
      expect(trackingNumber.value).toBe('ABCD123456');
    });

    it('should generate random tracking number', () => {
      const trackingNumber1 = TrackingNumber.generate();
      const trackingNumber2 = TrackingNumber.generate();
      
      expect(trackingNumber1.value).toHaveLength(10);
      expect(trackingNumber2.value).toHaveLength(10);
      expect(trackingNumber1.value).not.toBe(trackingNumber2.value);
      expect(trackingNumber1.value).toMatch(/^[A-Z0-9]+$/);
      expect(trackingNumber2.value).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate tracking numbers with only allowed characters', () => {
      for (let i = 0; i < 100; i++) {
        const trackingNumber = TrackingNumber.generate();
        expect(trackingNumber.value).toMatch(/^[A-Z0-9]+$/);
      }
    });
  });

  describe('validation', () => {
    it('should throw error for incorrect length', () => {
      expect(() => TrackingNumber.from('ABC123')).toThrow('Tracking number must be 10 characters long');
      expect(() => TrackingNumber.from('ABCD1234567')).toThrow('Tracking number must be 10 characters long');
    });

    it('should throw error for invalid characters', () => {
      expect(() => TrackingNumber.from('ABCD12345!')).toThrow('Tracking number must contain only uppercase letters and numbers');
      expect(() => TrackingNumber.from('abcd123456')).toThrow('Tracking number must contain only uppercase letters and numbers');
      expect(() => TrackingNumber.from('ABCD12345-')).toThrow('Tracking number must contain only uppercase letters and numbers');
    });

    it('should throw error for lowercase letters', () => {
      expect(() => TrackingNumber.from('abcd123456')).toThrow('Tracking number must contain only uppercase letters and numbers');
    });

    it('should throw error for special characters', () => {
      expect(() => TrackingNumber.from('ABCD12345!')).toThrow('Tracking number must contain only uppercase letters and numbers');
    });
  });

  describe('edge cases', () => {
    it('should handle all uppercase letters', () => {
      const trackingNumber = TrackingNumber.from('ABCDEFGHIJ');
      expect(trackingNumber.value).toBe('ABCDEFGHIJ');
    });

    it('should handle all numbers', () => {
      const trackingNumber = TrackingNumber.from('0123456789');
      expect(trackingNumber.value).toBe('0123456789');
    });

    it('should handle mixed alphanumeric', () => {
      const trackingNumber = TrackingNumber.from('A1B2C3D4E5');
      expect(trackingNumber.value).toBe('A1B2C3D4E5');
    });

    it('should handle tracking number starting with numbers', () => {
      const trackingNumber = TrackingNumber.from('12345ABCDE');
      expect(trackingNumber.value).toBe('12345ABCDE');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const trackingNumber = TrackingNumber.from('ABCD123456');
      expect(Object.isFrozen(trackingNumber)).toBe(true); // Check instance itself is frozen
      expect(() => {
        (trackingNumber as any).value = 'EFGH567890';
      }).toThrow();
    });
  });

  describe('equality', () => {
    it('should not be equal to tracking number with different case', () => {
      // This should throw an error during construction because lowercase is not allowed
      expect(() => TrackingNumber.from('abcd123456')).toThrow('Tracking number must contain only uppercase letters and numbers');
    });
  });

  describe('uniqueness of generated numbers', () => {
    it('should generate unique tracking numbers', () => {
      const generatedNumbers = new Set();
      
      for (let i = 0; i < 1000; i++) {
        const trackingNumber = TrackingNumber.generate();
        expect(generatedNumbers.has(trackingNumber.value)).toBe(false);
        generatedNumbers.add(trackingNumber.value);
      }
      
      expect(generatedNumbers.size).toBe(1000);
    });
  });
});

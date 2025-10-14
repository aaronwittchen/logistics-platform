import { CircuitBreaker, CircuitState } from '@/Shared/infrastructure/event-bus/CircuitBreaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(3, 100, 2); // 3 failures, 100ms timeout, 2 successes
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should execute successful operations in CLOSED state', async () => {
      const result = await circuitBreaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('failure handling', () => {
    it('should transition to OPEN state after threshold failures', async () => {
      // Fail 3 times to reach threshold
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(() => Promise.reject(new Error('fail'))))
          .rejects.toThrow('fail');
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should reject operations when in OPEN state', async () => {
      // Force circuit breaker to OPEN state
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // Ignore errors
        }
      }

      await expect(circuitBreaker.execute(() => Promise.resolve('success')))
        .rejects.toThrow('Circuit breaker is OPEN');
    });
  });

  describe('recovery mechanism', () => {
    beforeEach(async () => {
      // Force circuit breaker to OPEN state
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // Ignore errors
        }
      }
    });

    it('should transition to HALF_OPEN after recovery timeout', async () => {
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next operation should be allowed (HALF_OPEN state)
      const result = await circuitBreaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should transition back to CLOSED after consecutive successes', async () => {
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Execute 2 successful operations (success threshold is 2)
      await circuitBreaker.execute(() => Promise.resolve('success1'));
      await circuitBreaker.execute(() => Promise.resolve('success2'));

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition back to OPEN if HALF_OPEN operation fails', async () => {
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // First operation in HALF_OPEN state fails
      await expect(circuitBreaker.execute(() => Promise.reject(new Error('fail'))))
        .rejects.toThrow('fail');

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('custom configuration', () => {
    it('should accept custom failure threshold', async () => {
      const customCB = new CircuitBreaker(5, 1000, 1);
      
      // Should take 5 failures to open
      for (let i = 0; i < 4; i++) {
        try {
          await customCB.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // Ignore errors
        }
      }

      expect(customCB.getState()).toBe(CircuitState.CLOSED);

      try {
        await customCB.execute(() => Promise.reject(new Error('fail')));
      } catch {
        // Ignore error
      }

      expect(customCB.getState()).toBe(CircuitState.OPEN);
    });
  });
});

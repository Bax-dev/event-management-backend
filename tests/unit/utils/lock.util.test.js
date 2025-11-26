const { LockUtil } = require('../../../src/utils/lock.util');

describe('LockUtil', () => {
  beforeEach(() => {
    LockUtil.locks.clear();
  });

  afterEach(() => {
    LockUtil.locks.clear();
  });

  describe('acquire', () => {
    it('should acquire a lock successfully', async () => {
      const acquired = await LockUtil.acquire('test-key');

      expect(acquired).toBe(true);
      expect(LockUtil.isLocked('test-key')).toBe(true);
    });

    it('should fail to acquire an existing lock', async () => {
      await LockUtil.acquire('test-key');
      const acquired = await LockUtil.acquire('test-key');

      expect(acquired).toBe(false);
    });

    it('should acquire a lock with custom timeout', async () => {
      const timeoutMs = 5000;
      const acquired = await LockUtil.acquire('test-key', timeoutMs);

      expect(acquired).toBe(true);
      const lock = LockUtil.locks.get('test-key');
      expect(lock.expiresAt).toBeGreaterThan(Date.now());
      expect(lock.expiresAt).toBeLessThanOrEqual(Date.now() + timeoutMs);
    });

    it('should acquire a lock with custom holder', async () => {
      const holder = 'custom-holder';
      const acquired = await LockUtil.acquire('test-key', 1000, holder);

      expect(acquired).toBe(true);
      const lock = LockUtil.locks.get('test-key');
      expect(lock.holder).toBe(holder);
    });

    it('should acquire a lock after expiration', async () => {
      await LockUtil.acquire('test-key', 10); // 10ms timeout

      await new Promise((resolve) => setTimeout(resolve, 20));

      const acquired = await LockUtil.acquire('test-key');
      expect(acquired).toBe(true);
    });
  });

  describe('release', () => {
    it('should release an existing lock', async () => {
      await LockUtil.acquire('test-key');
      const released = LockUtil.release('test-key');

      expect(released).toBe(true);
      expect(LockUtil.isLocked('test-key')).toBe(false);
    });

    it('should return false when releasing non-existent lock', () => {
      const released = LockUtil.release('non-existent');

      expect(released).toBe(false);
    });

    it('should release lock with matching holder', async () => {
      const holder = 'test-holder';
      await LockUtil.acquire('test-key', 1000, holder);
      const released = LockUtil.release('test-key', holder);

      expect(released).toBe(true);
    });

    it('should not release lock with non-matching holder', async () => {
      await LockUtil.acquire('test-key', 1000, 'holder1');
      const released = LockUtil.release('test-key', 'holder2');

      expect(released).toBe(false);
      expect(LockUtil.isLocked('test-key')).toBe(true);
    });
  });

  describe('isLocked', () => {
    it('should return true for locked key', async () => {
      await LockUtil.acquire('test-key');
      const isLocked = LockUtil.isLocked('test-key');

      expect(isLocked).toBe(true);
    });

    it('should return false for unlocked key', () => {
      const isLocked = LockUtil.isLocked('test-key');

      expect(isLocked).toBe(false);
    });

    it('should return false for expired lock', async () => {
      await LockUtil.acquire('test-key', 10); // 10ms timeout

      await new Promise((resolve) => setTimeout(resolve, 20));

      const isLocked = LockUtil.isLocked('test-key');
      expect(isLocked).toBe(false);
    });
  });

  describe('withLock', () => {
    it('should execute operation with lock', async () => {
      let executed = false;
      const operation = async () => {
        executed = true;
        return 'result';
      };

      const result = await LockUtil.withLock('test-key', operation);

      expect(executed).toBe(true);
      expect(result).toBe('result');
      expect(LockUtil.isLocked('test-key')).toBe(false);
    });

    it('should release lock even if operation throws', async () => {
      const operation = async () => {
        throw new Error('Operation failed');
      };

      await expect(LockUtil.withLock('test-key', operation)).rejects.toThrow(
        'Operation failed'
      );
      expect(LockUtil.isLocked('test-key')).toBe(false);
    });

    it('should retry when lock is not available', async () => {
      await LockUtil.acquire('test-key', 50); // Short timeout

      let attempts = 0;
      const operation = async () => {
        attempts++;
        return 'result';
      };

      // Lock will expire quickly, then operation should succeed
      const result = await LockUtil.withLock(
        'test-key',
        operation,
        1000,
        200, // maxWaitMs
        10 // retryIntervalMs
      );

      expect(result).toBe('result');
      expect(attempts).toBe(1);
    });

    it('should throw error when unable to acquire lock', async () => {
      await LockUtil.acquire('test-key', 10000); // Long timeout

      const operation = async () => 'result';

      await expect(
        LockUtil.withLock('test-key', operation, 1000, 50, 10) // Very short maxWaitMs
      ).rejects.toThrow('Failed to acquire lock for key: test-key');
    });
  });

  describe('cleanup', () => {
    it('should remove expired locks', async () => {
      await LockUtil.acquire('expired-key', 10); // 10ms timeout
      await LockUtil.acquire('valid-key', 10000); // 10s timeout

      await new Promise((resolve) => setTimeout(resolve, 20));

      LockUtil.cleanup();

      expect(LockUtil.isLocked('expired-key')).toBe(false);
      expect(LockUtil.isLocked('valid-key')).toBe(true);
    });
  });
});


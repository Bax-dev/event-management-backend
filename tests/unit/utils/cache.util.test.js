const { CacheUtil } = require('../../../src/utils/cache.util');

describe('CacheUtil', () => {
  beforeEach(() => {
    CacheUtil.clear();
  });

  afterEach(() => {
    CacheUtil.clear();
  });

  describe('set and get', () => {
    it('should set and get a value', () => {
      CacheUtil.set('test-key', 'test-value');
      const value = CacheUtil.get('test-key');

      expect(value).toBe('test-value');
    });

    it('should return null for non-existent key', () => {
      const value = CacheUtil.get('non-existent');

      expect(value).toBeNull();
    });

    it('should use default TTL when not provided', () => {
      const now = Date.now();
      CacheUtil.set('test-key', 'test-value');

      const entry = CacheUtil.cache.get('test-key');
      expect(entry).toBeDefined();
      expect(entry.expiresAt).toBeGreaterThan(now);
      expect(entry.expiresAt).toBeLessThanOrEqual(now + CacheUtil.defaultTTL);
    });

    it('should use custom TTL when provided', () => {
      const customTTL = 1000;
      const now = Date.now();
      CacheUtil.set('test-key', 'test-value', customTTL);

      const entry = CacheUtil.cache.get('test-key');
      expect(entry.expiresAt).toBeGreaterThan(now);
      expect(entry.expiresAt).toBeLessThanOrEqual(now + customTTL);
    });

    it('should return null for expired entry', (done) => {
      CacheUtil.set('test-key', 'test-value', 10); // 10ms TTL

      setTimeout(() => {
        const value = CacheUtil.get('test-key');
        expect(value).toBeNull();
        done();
      }, 20);
    }, 100);

    it('should overwrite existing value', () => {
      CacheUtil.set('test-key', 'value1');
      CacheUtil.set('test-key', 'value2');

      const value = CacheUtil.get('test-key');
      expect(value).toBe('value2');
    });
  });

  describe('delete', () => {
    it('should delete an existing key', () => {
      CacheUtil.set('test-key', 'test-value');
      const deleted = CacheUtil.delete('test-key');

      expect(deleted).toBe(true);
      expect(CacheUtil.get('test-key')).toBeNull();
    });

    it('should return false for non-existent key', () => {
      const deleted = CacheUtil.delete('non-existent');

      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      CacheUtil.set('key1', 'value1');
      CacheUtil.set('key2', 'value2');
      CacheUtil.clear();

      expect(CacheUtil.get('key1')).toBeNull();
      expect(CacheUtil.get('key2')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      CacheUtil.set('test-key', 'test-value');
      const hasKey = CacheUtil.has('test-key');

      expect(hasKey).toBe(true);
    });

    it('should return false for non-existent key', () => {
      const hasKey = CacheUtil.has('non-existent');

      expect(hasKey).toBe(false);
    });

    it('should return false for expired key', (done) => {
      CacheUtil.set('test-key', 'test-value', 10); // 10ms TTL

      setTimeout(() => {
        const hasKey = CacheUtil.has('test-key');
        expect(hasKey).toBe(false);
        done();
      }, 20);
    }, 100);
  });

  describe('invalidatePattern', () => {
    it('should delete keys matching pattern', () => {
      CacheUtil.set('event:123', 'value1');
      CacheUtil.set('event:456', 'value2');
      CacheUtil.set('booking:123', 'value3');
      CacheUtil.set('user:123', 'value4');

      const count = CacheUtil.invalidatePattern('event:*');

      expect(count).toBe(2);
      expect(CacheUtil.get('event:123')).toBeNull();
      expect(CacheUtil.get('event:456')).toBeNull();
      expect(CacheUtil.get('booking:123')).toBe('value3');
      expect(CacheUtil.get('user:123')).toBe('value4');
    });

    it('should return 0 when no keys match pattern', () => {
      CacheUtil.set('event:123', 'value1');

      const count = CacheUtil.invalidatePattern('nonexistent:*');

      expect(count).toBe(0);
      expect(CacheUtil.get('event:123')).toBe('value1');
    });

    it('should handle complex patterns', () => {
      CacheUtil.set('events:list:page1', 'value1');
      CacheUtil.set('events:list:page2', 'value2');
      CacheUtil.set('events:detail:123', 'value3');

      const count = CacheUtil.invalidatePattern('events:list:*');

      expect(count).toBe(2);
      expect(CacheUtil.get('events:list:page1')).toBeNull();
      expect(CacheUtil.get('events:list:page2')).toBeNull();
      expect(CacheUtil.get('events:detail:123')).toBe('value3');
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', (done) => {
      CacheUtil.set('expired-key', 'value', 10); // 10ms TTL
      CacheUtil.set('valid-key', 'value', 10000); // 10s TTL

      setTimeout(() => {
        CacheUtil.cleanup();

        expect(CacheUtil.get('expired-key')).toBeNull();
        expect(CacheUtil.get('valid-key')).toBe('value');
        done();
      }, 20);
    }, 100);
  });
});


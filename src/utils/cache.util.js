class CacheUtil {
  static cache = new Map();
  static defaultTTL = 5 * 60 * 1000;

  static set(key, value, ttlMs) {
    const ttl = ttlMs ?? CacheUtil.defaultTTL;
    const expiresAt = Date.now() + ttl;

    CacheUtil.cache.set(key, {
      value,
      expiresAt,
    });
  }

  static get(key) {
    const entry = CacheUtil.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      CacheUtil.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  static delete(key) {
    return CacheUtil.cache.delete(key);
  }

  static clear() {
    CacheUtil.cache.clear();
  }

  static has(key) {
    const entry = CacheUtil.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      CacheUtil.cache.delete(key);
      return false;
    }

    return true;
  }

  static invalidatePattern(pattern) {
    let count = 0;
    const regex = new RegExp(pattern.replace('*', '.*'));

    for (const key of CacheUtil.cache.keys()) {
      if (regex.test(key)) {
        CacheUtil.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  static cleanup() {
    const now = Date.now();
    for (const [key, entry] of CacheUtil.cache.entries()) {
      if (now > entry.expiresAt) {
        CacheUtil.cache.delete(key);
      }
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    CacheUtil.cleanup();
  }, 60 * 1000);
}

module.exports = { CacheUtil };

class LockUtil {
  static locks = new Map();
  static defaultTimeout = 30 * 1000;

  static async acquire(key, timeoutMs = LockUtil.defaultTimeout, holder) {
    const lockHolder = holder || `lock_${Date.now()}_${Math.random()}`;
    const expiresAt = Date.now() + timeoutMs;

    const existingLock = LockUtil.locks.get(key);
    if (existingLock && Date.now() < existingLock.expiresAt) {
      return false;
    }

    LockUtil.locks.set(key, {
      expiresAt,
      holder: lockHolder,
    });

    return true;
  }

  static release(key, holder) {
    const lock = LockUtil.locks.get(key);

    if (!lock) {
      return false;
    }

    if (holder && lock.holder !== holder) {
      return false;
    }

    return LockUtil.locks.delete(key);
  }

  static isLocked(key) {
    const lock = LockUtil.locks.get(key);

    if (!lock) {
      return false;
    }

    if (Date.now() >= lock.expiresAt) {
      LockUtil.locks.delete(key);
      return false;
    }

    return true;
  }

  static async withLock(
    key,
    operation,
    timeoutMs = LockUtil.defaultTimeout,
    maxWaitMs = 5000,
    retryIntervalMs = 100
  ) {
    const startTime = Date.now();
    const holder = `lock_${Date.now()}_${Math.random()}`;

    while (Date.now() - startTime < maxWaitMs) {
      const acquired = await LockUtil.acquire(key, timeoutMs, holder);

      if (acquired) {
        try {
          return await operation();
        } finally {
          LockUtil.release(key, holder);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    }

    throw new Error(`Failed to acquire lock for key: ${key}`);
  }

  static cleanup() {
    const now = Date.now();
    for (const [key, lock] of LockUtil.locks.entries()) {
      if (now >= lock.expiresAt) {
        LockUtil.locks.delete(key);
      }
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    LockUtil.cleanup();
  }, 10 * 1000);
}

module.exports = { LockUtil };

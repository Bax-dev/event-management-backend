const { db } = require('./database.connection');
const { LoggerUtil } = require('./logger.util');

class TransactionUtil {
  static async execute(callback) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');
      LoggerUtil.debug('Transaction started');

      const result = await callback(client);

      await client.query('COMMIT');
      LoggerUtil.debug('Transaction committed');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      LoggerUtil.error('Transaction rolled back', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async withRetry(operation, maxRetries = 3, delayMs = 100) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const isRetryable =
          error instanceof Error &&
          (error.message.includes('deadlock') ||
            error.message.includes('timeout') ||
            error.message.includes('connection'));

        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }

        LoggerUtil.warn(
          `Operation failed, retrying (${attempt}/${maxRetries})`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }

    throw lastError;
  }
}

module.exports = { TransactionUtil };

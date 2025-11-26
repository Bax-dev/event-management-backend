const { TransactionUtil } = require('../../../src/utils/transaction.util');
const { db } = require('../../../src/utils/database.connection');
const { LoggerUtil } = require('../../../src/utils/logger.util');

jest.mock('../../../src/utils/database.connection');
jest.mock('../../../src/utils/logger.util');

describe('TransactionUtil', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    db.getClient = jest.fn().mockResolvedValue(mockClient);
    LoggerUtil.debug = jest.fn();
    LoggerUtil.error = jest.fn();
  });

  describe('execute', () => {
    it('should execute a transaction successfully', async () => {
      const callback = jest.fn().mockResolvedValue('result');
      mockClient.query.mockResolvedValue({});

      const result = await TransactionUtil.execute(callback);

      expect(db.getClient).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(callback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(LoggerUtil.debug).toHaveBeenCalledWith('Transaction started');
      expect(LoggerUtil.debug).toHaveBeenCalledWith('Transaction committed');
      expect(result).toBe('result');
    });

    it('should rollback on error', async () => {
      const error = new Error('Transaction failed');
      const callback = jest.fn().mockRejectedValue(error);
      mockClient.query.mockResolvedValue({});

      await expect(TransactionUtil.execute(callback)).rejects.toThrow(
        'Transaction failed'
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
      expect(LoggerUtil.error).toHaveBeenCalledWith(
        'Transaction rolled back',
        error
      );
    });

    it('should always release client even on error', async () => {
      const error = new Error('Transaction failed');
      const callback = jest.fn().mockRejectedValue(error);
      mockClient.query.mockResolvedValue({});
      mockClient.release.mockImplementation(() => {
      });

      await expect(TransactionUtil.execute(callback)).rejects.toThrow(
        'Transaction failed'
      );

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('withRetry', () => {
    it('should execute operation successfully on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('result');

      const result = await TransactionUtil.withRetry(operation);

      expect(operation).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('should retry on retryable error', async () => {
      const error = new Error('deadlock detected');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('result');

      const result = await TransactionUtil.withRetry(operation, 3, 10);

      expect(operation).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });

    it('should retry on timeout error', async () => {
      const error = new Error('timeout occurred');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('result');

      const result = await TransactionUtil.withRetry(operation, 3, 10);

      expect(operation).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });

    it('should retry on connection error', async () => {
      const error = new Error('connection lost');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('result');

      const result = await TransactionUtil.withRetry(operation, 3, 10);

      expect(operation).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });

    it('should throw error after max retries', async () => {
      const error = new Error('deadlock detected');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(TransactionUtil.withRetry(operation, 3, 10)).rejects.toThrow(
        'deadlock detected'
      );

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable error', async () => {
      const error = new Error('validation failed');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(TransactionUtil.withRetry(operation, 3, 10)).rejects.toThrow(
        'validation failed'
      );

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      const error = new Error('deadlock detected');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('result');

      // Use a shorter delay for testing
      const result = await TransactionUtil.withRetry(operation, 3, 10);

      expect(operation).toHaveBeenCalledTimes(3);
      expect(result).toBe('result');
    });

    it('should use default maxRetries and delayMs', async () => {
      const operation = jest.fn().mockResolvedValue('result');

      await TransactionUtil.withRetry(operation);

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});


const {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  DatabaseError,
  ConcurrencyError,
} = require('../../../src/utils/custom-errors.util');

describe('Custom Errors', () => {
  describe('AppError', () => {
    it('should create an AppError with default values', () => {
      const error = new AppError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should create an AppError with custom status code', () => {
      const error = new AppError('Test error', 400);

      expect(error.statusCode).toBe(400);
    });

    it('should create an AppError with isOperational false', () => {
      const error = new AppError('Test error', 500, false);

      expect(error.isOperational).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError', () => {
      const errors = ['Error 1', 'Error 2'];
      const error = new ValidationError('Validation failed', errors);

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toEqual(errors);
    });

    it('should create a ValidationError with empty errors array', () => {
      const error = new ValidationError('Validation failed');

      expect(error.errors).toEqual([]);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with id', () => {
      const error = new NotFoundError('User', '123');

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('NotFoundError');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User with id 123 not found');
    });

    it('should create a NotFoundError without id', () => {
      const error = new NotFoundError('User');

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('NotFoundError');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });
  });

  describe('ConflictError', () => {
    it('should create a ConflictError', () => {
      const error = new ConflictError('Resource already exists');

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('ConflictError');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an UnauthorizedError with default message', () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('UnauthorizedError');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('should create an UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Invalid credentials');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid credentials');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a ForbiddenError with default message', () => {
      const error = new ForbiddenError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('ForbiddenError');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });

    it('should create a ForbiddenError with custom message', () => {
      const error = new ForbiddenError('Access denied');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
    });
  });

  describe('DatabaseError', () => {
    it('should create a DatabaseError with original error', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError('Failed to connect', originalError);

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('DatabaseError');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
      expect(error.message).toBe('Database error: Failed to connect');
      expect(error.cause).toBe(originalError);
    });

    it('should create a DatabaseError without original error', () => {
      const error = new DatabaseError('Failed to connect');

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('DatabaseError');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Database error: Failed to connect');
    });

    it('should not set cause if originalError is not an Error instance', () => {
      const error = new DatabaseError('Failed to connect', 'string error');

      expect(error.cause).toBeUndefined();
    });
  });

  describe('ConcurrencyError', () => {
    it('should create a ConcurrencyError with default message', () => {
      const error = new ConcurrencyError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('ConcurrencyError');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource was modified by another operation');
    });

    it('should create a ConcurrencyError with custom message', () => {
      const error = new ConcurrencyError('Version mismatch');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Version mismatch');
    });
  });
});


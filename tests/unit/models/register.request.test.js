const { RegisterRequestModel } = require('../../../src/model/request/user/register.request');

describe('RegisterRequestModel', () => {
  describe('validate', () => {
    it('should return valid for correct data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '12345678901',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when email is missing', () => {
      const data = {
        password: 'password123',
        name: 'Test User',
        phone: '12345678901',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should return invalid when email is empty string', () => {
      const data = {
        email: '   ',
        password: 'password123',
        name: 'Test User',
        phone: '12345678901',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should return invalid when email format is incorrect', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
        phone: '12345678901',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should return invalid when password is missing', () => {
      const data = {
        email: 'test@example.com',
        name: 'Test User',
        phone: '12345678901',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should return invalid when password is too short', () => {
      const data = {
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
        phone: '12345678901',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should return invalid when name exceeds 200 characters', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'a'.repeat(201),
        phone: '12345678901',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be less than 200 characters');
    });

    it('should return valid when name is exactly 200 characters', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'a'.repeat(200),
        phone: '12345678901',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when phone is not 11 digits', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890', // 10 digits
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid phone number format');
    });

    it('should return invalid when phone contains non-digits', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890a',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid phone number format');
    });

    it('should return valid when phone is exactly 11 digits', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '12345678901',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return valid when phone is not provided', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return valid when name is not provided', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        phone: '12345678901',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const data = {
        email: 'invalid-email',
        password: 'short',
        name: 'a'.repeat(201),
        phone: '123',
      };

      const model = new RegisterRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Invalid email format');
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Name must be less than 200 characters');
      expect(result.errors).toContain('Invalid phone number format');
    });
  });
});


const { LoginRequestModel } = require('../../../src/model/request/user/login.request');

describe('LoginRequestModel', () => {
  describe('validate', () => {
    it('should return valid for correct data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };

      const model = new LoginRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when email is missing', () => {
      const data = {
        password: 'password123',
      };

      const model = new LoginRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should return invalid when email is empty string', () => {
      const data = {
        email: '   ',
        password: 'password123',
      };

      const model = new LoginRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should return invalid when password is missing', () => {
      const data = {
        email: 'test@example.com',
      };

      const model = new LoginRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should return invalid when password is empty string', () => {
      const data = {
        email: 'test@example.com',
        password: '',
      };

      const model = new LoginRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should return both errors when both email and password are missing', () => {
      const data = {};

      const model = new LoginRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Email is required');
      expect(result.errors).toContain('Password is required');
    });
  });
});


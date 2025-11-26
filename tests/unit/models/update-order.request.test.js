const { UpdateOrderRequestModel } = require('../../../src/model/request/order/update-order.request');

describe('UpdateOrderRequestModel', () => {
  describe('validate', () => {
    it('should return valid for correct data', () => {
      const data = {
        status: 'PAID',
        paymentStatus: 'PAID',
        customerEmail: 'john@example.com',
      };

      const model = new UpdateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid when no fields provided', () => {
      const data = {};

      const model = new UpdateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when customerEmail format is incorrect', () => {
      const data = {
        customerEmail: 'invalid-email',
      };

      const model = new UpdateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should return valid when customerEmail is not provided', () => {
      const data = {
        status: 'PAID',
        paymentMethod: 'card',
      };

      const model = new UpdateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return valid when customerEmail is valid', () => {
      const data = {
        customerEmail: 'test@example.com',
      };

      const model = new UpdateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should accept all optional fields', () => {
      const data = {
        status: 'PAID',
        paymentStatus: 'PAID',
        paymentMethod: 'card',
        paymentTransactionId: 'txn_123',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '12345678901',
        billingAddress: '123 Main St',
        notes: 'Special instructions',
      };

      const model = new UpdateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });
  });
});


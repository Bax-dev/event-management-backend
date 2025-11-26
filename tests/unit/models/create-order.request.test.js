const { CreateOrderRequestModel } = require('../../../src/model/request/order/create-order.request');

describe('CreateOrderRequestModel', () => {
  describe('validate', () => {
    it('should return valid for correct data', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: 1000,
        currency: 'NGN',
        paymentMethod: 'card',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '12345678901',
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when userId is missing', () => {
      const data = {
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: 1000,
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User ID is required');
    });

    it('should return invalid when userId is empty string', () => {
      const data = {
        userId: '   ',
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: 1000,
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User ID is required');
    });

    it('should return invalid when eventId is missing', () => {
      const data = {
        userId: 'user_123',
        bookingId: 'booking_789',
        totalAmount: 1000,
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event ID is required');
    });

    it('should return invalid when bookingId is missing', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        totalAmount: 1000,
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Booking ID is required');
    });

    it('should return invalid when totalAmount is missing', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        bookingId: 'booking_789',
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total amount must be greater than 0');
    });

    it('should return invalid when totalAmount is zero', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: 0,
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total amount must be greater than 0');
    });

    it('should return invalid when totalAmount is negative', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: -100,
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total amount must be greater than 0');
    });

    it('should return invalid when totalAmount exceeds 1,000,000', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: 1000001,
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total amount cannot exceed 1,000,000');
    });

    it('should return valid when totalAmount is exactly 1,000,000', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: 1000000,
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when customerEmail format is incorrect', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: 1000,
        customerEmail: 'invalid-email',
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should return valid when customerEmail is not provided', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: 1000,
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when currency is not 3 letters', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: 1000,
        currency: 'NG',
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Currency must be a 3-letter code (e.g., NGN, USD)');
    });

    it('should return valid when currency is 3 letters', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: 1000,
        currency: 'USD',
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should use default currency NGN when not provided', () => {
      const data = {
        userId: 'user_123',
        eventId: 'event_456',
        bookingId: 'booking_789',
        totalAmount: 1000,
      };

      const model = new CreateOrderRequestModel(data);

      expect(model.currency).toBe('NGN');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const data = {
        userId: '   ',
        eventId: '',
        bookingId: '   ',
        totalAmount: -100,
        currency: 'NG',
        customerEmail: 'invalid',
      };

      const model = new CreateOrderRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('User ID is required');
      expect(result.errors).toContain('Event ID is required');
      expect(result.errors).toContain('Booking ID is required');
      expect(result.errors).toContain('Total amount must be greater than 0');
      expect(result.errors).toContain('Invalid email format');
      expect(result.errors).toContain('Currency must be a 3-letter code (e.g., NGN, USD)');
    });
  });
});


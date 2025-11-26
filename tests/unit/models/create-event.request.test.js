const { CreateEventRequestModel } = require('../../../src/model/request/event/create-event.request');

describe('CreateEventRequestModel', () => {
  describe('validate', () => {
    it('should return valid for correct data', () => {
      const data = {
        name: 'Test Event',
        description: 'Test Description',
        totalTickets: 100,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when name is missing', () => {
      const data = {
        description: 'Test Description',
        totalTickets: 100,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event name is required');
    });

    it('should return invalid when name is empty string', () => {
      const data = {
        name: '   ',
        description: 'Test Description',
        totalTickets: 100,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event name is required');
    });

    it('should return invalid when name exceeds 200 characters', () => {
      const data = {
        name: 'a'.repeat(201),
        description: 'Test Description',
        totalTickets: 100,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event name must be less than 200 characters');
    });

    it('should return valid when name is exactly 200 characters', () => {
      const data = {
        name: 'a'.repeat(200),
        description: 'Test Description',
        totalTickets: 100,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when totalTickets is missing', () => {
      const data = {
        name: 'Test Event',
        description: 'Test Description',
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total tickets must be greater than 0');
    });

    it('should return invalid when totalTickets is zero', () => {
      const data = {
        name: 'Test Event',
        description: 'Test Description',
        totalTickets: 0,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total tickets must be greater than 0');
    });

    it('should return invalid when totalTickets is negative', () => {
      const data = {
        name: 'Test Event',
        description: 'Test Description',
        totalTickets: -10,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total tickets must be greater than 0');
    });

    it('should return invalid when totalTickets is not an integer', () => {
      const data = {
        name: 'Test Event',
        description: 'Test Description',
        totalTickets: 100.5,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total tickets must be an integer');
    });

    it('should return invalid when totalTickets exceeds 1,000,000', () => {
      const data = {
        name: 'Test Event',
        description: 'Test Description',
        totalTickets: 1000001,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total tickets cannot exceed 1,000,000');
    });

    it('should return valid when totalTickets is exactly 1,000,000', () => {
      const data = {
        name: 'Test Event',
        description: 'Test Description',
        totalTickets: 1000000,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when description exceeds 1000 characters', () => {
      const data = {
        name: 'Test Event',
        description: 'a'.repeat(1001),
        totalTickets: 100,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description must be less than 1000 characters');
    });

    it('should return valid when description is exactly 1000 characters', () => {
      const data = {
        name: 'Test Event',
        description: 'a'.repeat(1000),
        totalTickets: 100,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return valid when description is not provided', () => {
      const data = {
        name: 'Test Event',
        totalTickets: 100,
      };

      const model = new CreateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });
  });
});


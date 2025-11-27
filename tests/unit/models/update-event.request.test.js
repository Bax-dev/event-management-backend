const { UpdateEventRequestModel } = require('../../../src/model/request/event/update-event.request');

describe('UpdateEventRequestModel', () => {
  describe('validate', () => {
    it('should return valid for correct data', () => {
      const data = {
        name: 'Updated Event',
        description: 'Updated Description',
        totalTickets: 150,
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid when no fields provided', () => {
      const data = {};

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when name is empty string', () => {
      const data = {
        name: '   ',
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event name cannot be empty');
    });

    it('should return invalid when name exceeds 200 characters', () => {
      const data = {
        name: 'a'.repeat(201),
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event name must be less than 200 characters');
    });

    it('should return valid when name is exactly 200 characters', () => {
      const data = {
        name: 'a'.repeat(200),
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return valid when name is not provided', () => {
      const data = {
        description: 'Some description',
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return valid when totalTickets is zero (additive behavior)', () => {
      const data = {
        totalTickets: 0,
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      // Zero is valid because totalTickets is added to existing value
      // Final validation happens in service layer
    });

    it('should return valid when totalTickets is negative (allows reduction)', () => {
      const data = {
        totalTickets: -10,
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      // Negative values are valid because totalTickets is added to existing value
      // Final validation (e.g., not below booked tickets) happens in service layer
    });

    it('should return invalid when totalTickets is not an integer', () => {
      const data = {
        totalTickets: 100.5,
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total tickets must be an integer');
    });

    it('should return valid when totalTickets exceeds 1,000,000 (additive behavior)', () => {
      const data = {
        totalTickets: 1000001,
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      // Large values are valid because totalTickets is added to existing value
      // Final validation (e.g., max limit) happens in service layer
    });

    it('should return valid when totalTickets is exactly 1,000,000', () => {
      const data = {
        totalTickets: 1000000,
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return valid when totalTickets is not provided', () => {
      const data = {
        name: 'Updated Event',
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when description exceeds 1000 characters', () => {
      const data = {
        description: 'a'.repeat(1001),
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description must be less than 1000 characters');
    });

    it('should return valid when description is exactly 1000 characters', () => {
      const data = {
        description: 'a'.repeat(1000),
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return valid when description is not provided', () => {
      const data = {
        name: 'Updated Event',
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const data = {
        name: '   ',
        totalTickets: -10, // Valid now (additive behavior)
        description: 'a'.repeat(1001),
      };

      const model = new UpdateEventRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Event name cannot be empty');
      expect(result.errors).toContain('Description must be less than 1000 characters');
      // totalTickets validation removed - handled in service layer
    });
  });
});


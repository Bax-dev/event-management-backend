const { CreateWaitingListRequestModel } = require('../../../src/model/request/waiting-list/create-waiting-list.request');

describe('CreateWaitingListRequestModel', () => {
  describe('validate', () => {
    it('should return valid for correct data', () => {
      const data = {
        eventId: 'event_123',
        userId: 'user_456',
        numberOfTickets: 2,
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when eventId is missing', () => {
      const data = {
        userId: 'user_456',
        numberOfTickets: 2,
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event ID is required');
    });

    it('should return invalid when eventId is empty string', () => {
      const data = {
        eventId: '   ',
        userId: 'user_456',
        numberOfTickets: 2,
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event ID is required');
    });

    it('should return invalid when userId is missing', () => {
      const data = {
        eventId: 'event_123',
        numberOfTickets: 2,
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User ID is required');
    });

    it('should return invalid when userId is empty string', () => {
      const data = {
        eventId: 'event_123',
        userId: '   ',
        numberOfTickets: 2,
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User ID is required');
    });

    it('should return invalid when numberOfTickets is missing', () => {
      const data = {
        eventId: 'event_123',
        userId: 'user_456',
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number of tickets must be greater than 0');
    });

    it('should return invalid when numberOfTickets is zero', () => {
      const data = {
        eventId: 'event_123',
        userId: 'user_456',
        numberOfTickets: 0,
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number of tickets must be greater than 0');
    });

    it('should return invalid when numberOfTickets is negative', () => {
      const data = {
        eventId: 'event_123',
        userId: 'user_456',
        numberOfTickets: -5,
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number of tickets must be greater than 0');
    });

    it('should return invalid when numberOfTickets is not an integer', () => {
      const data = {
        eventId: 'event_123',
        userId: 'user_456',
        numberOfTickets: 2.5,
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number of tickets must be an integer');
    });

    it('should return invalid when numberOfTickets exceeds 100', () => {
      const data = {
        eventId: 'event_123',
        userId: 'user_456',
        numberOfTickets: 101,
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot request more than 100 tickets on waiting list');
    });

    it('should return valid when numberOfTickets is exactly 100', () => {
      const data = {
        eventId: 'event_123',
        userId: 'user_456',
        numberOfTickets: 100,
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const data = {
        eventId: '   ',
        userId: '',
        numberOfTickets: -5,
      };

      const model = new CreateWaitingListRequestModel(data);
      const result = model.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Event ID is required');
      expect(result.errors).toContain('User ID is required');
      expect(result.errors).toContain('Number of tickets must be greater than 0');
    });
  });
});


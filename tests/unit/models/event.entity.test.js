const { Event } = require('../../../src/model/entity/event.entity');

describe('Event Entity', () => {
  describe('constructor', () => {
    it('should create an event with all fields', () => {
      const data = {
        id: 'event_123',
        name: 'Test Event',
        description: 'Test Description',
        totalTickets: 100,
        availableTickets: 50,
        bookedTickets: 50,
        version: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const event = new Event(data);

      expect(event.id).toBe(data.id);
      expect(event.name).toBe(data.name);
      expect(event.description).toBe(data.description);
      expect(event.totalTickets).toBe(data.totalTickets);
      expect(event.availableTickets).toBe(data.availableTickets);
      expect(event.bookedTickets).toBe(data.bookedTickets);
      expect(event.version).toBe(data.version);
      expect(event.createdAt).toEqual(data.createdAt);
      expect(event.updatedAt).toEqual(data.updatedAt);
    });

    it('should create an event with default values', () => {
      const event = new Event({});

      expect(event.id).toBe('');
      expect(event.name).toBe('');
      expect(event.description).toBeUndefined();
      expect(event.totalTickets).toBe(0);
      expect(event.availableTickets).toBe(0);
      expect(event.bookedTickets).toBe(0);
      expect(event.version).toBe(0);
      expect(event.createdAt).toBeInstanceOf(Date);
      expect(event.updatedAt).toBeInstanceOf(Date);
    });

    it('should set availableTickets to totalTickets when not provided', () => {
      const event = new Event({ totalTickets: 100 });

      expect(event.availableTickets).toBe(100);
    });

    it('should use provided availableTickets when provided', () => {
      const event = new Event({ totalTickets: 100, availableTickets: 50 });

      expect(event.availableTickets).toBe(50);
    });
  });

  describe('getVersion', () => {
    it('should return version number', () => {
      const event = new Event({ version: 5 });

      expect(event.getVersion()).toBe(5);
    });

    it('should return 0 when version is undefined', () => {
      const event = new Event({});

      expect(event.getVersion()).toBe(0);
    });
  });

  describe('setVersion', () => {
    it('should set version number', () => {
      const event = new Event({ version: 1 });

      event.setVersion(5);

      expect(event.version).toBe(5);
      expect(event.getVersion()).toBe(5);
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const data = {
        id: 'event_123',
        name: 'Test Event',
        description: 'Test Description',
        totalTickets: 100,
        availableTickets: 50,
        bookedTickets: 50,
        version: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const event = new Event(data);
      const json = event.toJSON();

      expect(json).toEqual({
        id: data.id,
        name: data.name,
        description: data.description,
        totalTickets: data.totalTickets,
        availableTickets: data.availableTickets,
        bookedTickets: data.bookedTickets,
        version: data.version,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
  });

  describe('updateAvailableTickets', () => {
    it('should update availableTickets based on totalTickets and bookedTickets', () => {
      const event = new Event({
        totalTickets: 100,
        bookedTickets: 30,
      });

      event.updateAvailableTickets();

      expect(event.availableTickets).toBe(70);
    });

    it('should handle zero booked tickets', () => {
      const event = new Event({
        totalTickets: 100,
        bookedTickets: 0,
      });

      event.updateAvailableTickets();

      expect(event.availableTickets).toBe(100);
    });

    it('should handle all tickets booked', () => {
      const event = new Event({
        totalTickets: 100,
        bookedTickets: 100,
      });

      event.updateAvailableTickets();

      expect(event.availableTickets).toBe(0);
    });
  });
});


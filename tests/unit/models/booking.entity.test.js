const { Booking } = require('../../../src/model/entity/booking.entity');
const { BOOKING_STATUS } = require('../../../src/constants');

describe('Booking Entity', () => {
  describe('constructor', () => {
    it('should create a booking with all fields', () => {
      const data = {
        id: 'booking_123',
        eventId: 'event_456',
        userId: 'user_789',
        numberOfTickets: 2,
        status: BOOKING_STATUS.CONFIRMED,
        version: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const booking = new Booking(data);

      expect(booking.id).toBe(data.id);
      expect(booking.eventId).toBe(data.eventId);
      expect(booking.userId).toBe(data.userId);
      expect(booking.numberOfTickets).toBe(data.numberOfTickets);
      expect(booking.status).toBe(data.status);
      expect(booking.version).toBe(data.version);
      expect(booking.createdAt).toEqual(data.createdAt);
      expect(booking.updatedAt).toEqual(data.updatedAt);
    });

    it('should create a booking with default values', () => {
      const booking = new Booking({});

      expect(booking.id).toBe('');
      expect(booking.eventId).toBe('');
      expect(booking.userId).toBe('');
      expect(booking.numberOfTickets).toBe(0);
      expect(booking.status).toBe(BOOKING_STATUS.PENDING);
      expect(booking.version).toBe(0);
      expect(booking.createdAt).toBeInstanceOf(Date);
      expect(booking.updatedAt).toBeInstanceOf(Date);
    });

    it('should use PENDING status by default', () => {
      const booking = new Booking({ eventId: 'event_123' });

      expect(booking.status).toBe(BOOKING_STATUS.PENDING);
    });
  });

  describe('getVersion', () => {
    it('should return version number', () => {
      const booking = new Booking({ version: 5 });

      expect(booking.getVersion()).toBe(5);
    });

    it('should return 0 when version is undefined', () => {
      const booking = new Booking({});

      expect(booking.getVersion()).toBe(0);
    });
  });

  describe('setVersion', () => {
    it('should set version number', () => {
      const booking = new Booking({ version: 1 });

      booking.setVersion(5);

      expect(booking.version).toBe(5);
      expect(booking.getVersion()).toBe(5);
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const data = {
        id: 'booking_123',
        eventId: 'event_456',
        userId: 'user_789',
        numberOfTickets: 2,
        status: BOOKING_STATUS.CONFIRMED,
        version: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const booking = new Booking(data);
      const json = booking.toJSON();

      expect(json).toEqual({
        id: data.id,
        eventId: data.eventId,
        userId: data.userId,
        numberOfTickets: data.numberOfTickets,
        status: data.status,
        version: data.version,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
  });
});


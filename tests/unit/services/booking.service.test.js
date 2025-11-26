const { BookingService } = require('../../../src/services/booking.service');
const { BookingRepository } = require('../../../src/repositories/booking.repository');
const { EventRepository } = require('../../../src/repositories/event.repository');
const { TransactionUtil } = require('../../../src/utils/transaction.util');
const { CacheUtil } = require('../../../src/utils/cache.util');
const { LockUtil } = require('../../../src/utils/lock.util');
const { IdGeneratorUtil } = require('../../../src/utils/id-generator.util');
const { BOOKING_STATUS } = require('../../../src/constants');
const {
  NotFoundError,
  ConflictError,
  ConcurrencyError,
  DatabaseError,
} = require('../../../src/utils/custom-errors.util');

const mockBookingRepositoryInstance = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEventId: jest.fn(),
  update: jest.fn(),
  getTotalBookedTicketsForEvent: jest.fn(),
};

const mockEventRepositoryInstance = {
  findById: jest.fn(),
  update: jest.fn(),
};

jest.mock('../../../src/repositories/booking.repository', () => {
  return {
    BookingRepository: jest.fn(() => mockBookingRepositoryInstance),
  };
});
jest.mock('../../../src/repositories/event.repository', () => {
  return {
    EventRepository: jest.fn(() => mockEventRepositoryInstance),
  };
});
jest.mock('../../../src/utils/transaction.util');
jest.mock('../../../src/utils/cache.util');
jest.mock('../../../src/utils/lock.util');
jest.mock('../../../src/utils/id-generator.util');
jest.mock('../../../src/utils/database.connection');

describe('BookingService', () => {
  let bookingService;
  let mockBookingRepository;
  let mockEventRepository;
  let cacheGetSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks first
    TransactionUtil.execute = jest.fn((callback) => callback(null));
    TransactionUtil.withRetry = jest.fn((callback) => callback());
    cacheGetSpy = jest.spyOn(CacheUtil, 'get').mockReturnValue(null);
    jest.spyOn(CacheUtil, 'set').mockImplementation(() => {});
    jest.spyOn(CacheUtil, 'delete').mockImplementation(() => {});
    jest.spyOn(CacheUtil, 'invalidatePattern').mockImplementation(() => {});
    LockUtil.withLock = jest.fn((key, callback) => callback());
    jest.spyOn(IdGeneratorUtil, 'generateId').mockReturnValue('booking_123');
    
    bookingService = new BookingService();
    
    bookingService.bookingRepository = mockBookingRepositoryInstance;
    bookingService.eventRepository = mockEventRepositoryInstance;
    
    mockBookingRepository = mockBookingRepositoryInstance;
    mockEventRepository = mockEventRepositoryInstance;

    TransactionUtil.execute = jest.fn((callback) => callback(null));
    TransactionUtil.withRetry = jest.fn((callback) => callback());
    cacheGetSpy = jest.spyOn(CacheUtil, 'get').mockReturnValue(null);
    jest.spyOn(CacheUtil, 'set').mockImplementation(() => {});
    jest.spyOn(CacheUtil, 'delete').mockImplementation(() => {});
    jest.spyOn(CacheUtil, 'invalidatePattern').mockImplementation(() => {});
    LockUtil.withLock = jest.fn((key, callback) => callback());
    jest.spyOn(IdGeneratorUtil, 'generateId').mockReturnValue('booking_123');
  });

  describe('createBooking', () => {
    const validBookingData = {
      eventId: 'event_123',
      userId: 'user_456',
      numberOfTickets: 2,
    };

    it('should create a booking successfully', async () => {
      const mockEvent = {
        id: 'event_123',
        name: 'Test Event',
        totalTickets: 100,
        availableTickets: 50,
        bookedTickets: 50,
        getVersion: jest.fn().mockReturnValue(0),
        updateAvailableTickets: jest.fn(),
      };

      const mockBooking = {
        id: 'booking_123',
        ...validBookingData,
        status: BOOKING_STATUS.CONFIRMED,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockBookingRepository.getTotalBookedTicketsForEvent.mockResolvedValue(50);
      mockBookingRepository.create.mockResolvedValue(mockBooking);
      mockBookingRepository.getTotalBookedTicketsForEvent
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(52);
      mockEventRepository.update.mockResolvedValue(mockEvent);

      const result = await bookingService.createBooking(validBookingData);

      expect(mockEventRepository.findById).toHaveBeenCalledWith(
        validBookingData.eventId,
        null
      );
      expect(mockBookingRepository.create).toHaveBeenCalled();
      expect(mockEventRepository.update).toHaveBeenCalled();
      expect(CacheUtil.delete).toHaveBeenCalledWith(`event:${validBookingData.eventId}`);
      expect(result).toEqual(mockBooking);
    });

    it('should throw NotFoundError when event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      await expect(
        bookingService.createBooking(validBookingData)
      ).rejects.toThrow(NotFoundError);
      await expect(
        bookingService.createBooking(validBookingData)
      ).rejects.toThrow(`Event with id ${validBookingData.eventId} not found`);

      expect(mockBookingRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when not enough tickets available', async () => {
      const mockEvent = {
        id: 'event_123',
        totalTickets: 100,
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockBookingRepository.getTotalBookedTicketsForEvent.mockResolvedValue(99);

      await expect(
        bookingService.createBooking({
          ...validBookingData,
          numberOfTickets: 5,
        })
      ).rejects.toThrow(ConflictError);
      await expect(
        bookingService.createBooking({
          ...validBookingData,
          numberOfTickets: 5,
        })
      ).rejects.toThrow('Not enough tickets available');

      expect(mockBookingRepository.create).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError on repository error', async () => {
      mockEventRepository.findById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        bookingService.createBooking(validBookingData)
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('getBookingById', () => {
    const bookingId = 'booking_123';

    it('should return cached booking when available', async () => {
      const cachedBooking = {
        id: bookingId,
        eventId: 'event_123',
        userId: 'user_456',
      };

      cacheGetSpy.mockReturnValue(cachedBooking);

      const result = await bookingService.getBookingById(bookingId);

      expect(CacheUtil.get).toHaveBeenCalledWith(`booking:${bookingId}`);
      expect(mockBookingRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(cachedBooking);
    });

    it('should fetch from repository and cache when not cached', async () => {
      const mockBooking = {
        id: bookingId,
        eventId: 'event_123',
        userId: 'user_456',
        numberOfTickets: 2,
        status: BOOKING_STATUS.CONFIRMED,
      };

      cacheGetSpy.mockReturnValue(null);
      mockBookingRepository.findById.mockResolvedValue(mockBooking);

      const result = await bookingService.getBookingById(bookingId);

      expect(mockBookingRepository.findById).toHaveBeenCalledWith(bookingId);
      expect(CacheUtil.set).toHaveBeenCalledWith(
        `booking:${bookingId}`,
        mockBooking,
        5 * 60 * 1000
      );
      expect(result).toEqual(mockBooking);
    });

    it('should return null when booking not found', async () => {
      cacheGetSpy.mockReturnValue(null);
      mockBookingRepository.findById.mockResolvedValue(null);

      const result = await bookingService.getBookingById(bookingId);

      expect(result).toBeNull();
      expect(CacheUtil.set).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError on repository error', async () => {
      cacheGetSpy.mockReturnValue(null);
      mockBookingRepository.findById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(bookingService.getBookingById(bookingId)).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('getBookingsByEventId', () => {
    const eventId = 'event_123';

    it('should return cached bookings when available', async () => {
      const cachedBookings = [
        { id: 'booking_1', eventId },
        { id: 'booking_2', eventId },
      ];

      cacheGetSpy.mockReturnValue(cachedBookings);

      const result = await bookingService.getBookingsByEventId(eventId);

      expect(CacheUtil.get).toHaveBeenCalledWith(`bookings:event:${eventId}`);
      expect(mockBookingRepository.findByEventId).not.toHaveBeenCalled();
      expect(result).toEqual(cachedBookings);
    });

    it('should fetch from repository and cache when not cached', async () => {
      const mockBookings = [
        { id: 'booking_1', eventId, userId: 'user_1' },
        { id: 'booking_2', eventId, userId: 'user_2' },
      ];

      cacheGetSpy.mockReturnValue(null);
      mockBookingRepository.findByEventId.mockResolvedValue(mockBookings);

      const result = await bookingService.getBookingsByEventId(eventId);

      expect(mockBookingRepository.findByEventId).toHaveBeenCalledWith(eventId);
      expect(CacheUtil.set).toHaveBeenCalledWith(
        `bookings:event:${eventId}`,
        mockBookings,
        2 * 60 * 1000
      );
      expect(result).toEqual(mockBookings);
    });
  });

  describe('cancelBooking', () => {
    const bookingId = 'booking_123';

    it('should cancel booking successfully', async () => {
      const mockBooking = {
        id: bookingId,
        eventId: 'event_123',
        userId: 'user_456',
        numberOfTickets: 2,
        status: BOOKING_STATUS.CONFIRMED,
        getVersion: jest.fn().mockReturnValue(0),
      };

      const mockEvent = {
        id: 'event_123',
        totalTickets: 100,
        bookedTickets: 50,
        availableTickets: 50,
        getVersion: jest.fn().mockReturnValue(0),
        updateAvailableTickets: jest.fn(),
      };

      const updatedBooking = {
        ...mockBooking,
        status: BOOKING_STATUS.CANCELLED,
        updatedAt: new Date(),
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockBookingRepository.getTotalBookedTicketsForEvent.mockResolvedValue(48);
      mockBookingRepository.update.mockResolvedValue(updatedBooking);
      mockEventRepository.update.mockResolvedValue(mockEvent);

      const result = await bookingService.cancelBooking(bookingId);

      expect(LockUtil.withLock).toHaveBeenCalled();
      expect(mockBookingRepository.findById).toHaveBeenCalledWith(bookingId, null);
      expect(mockBooking.status).toBe(BOOKING_STATUS.CANCELLED);
      expect(mockBookingRepository.update).toHaveBeenCalled();
      expect(mockEventRepository.update).toHaveBeenCalled();
      expect(CacheUtil.delete).toHaveBeenCalledWith(`booking:${bookingId}`);
      expect(result).toEqual(updatedBooking);
    });

    it('should throw NotFoundError when booking does not exist', async () => {
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(bookingService.cancelBooking(bookingId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ConflictError when booking is already cancelled', async () => {
      const mockBooking = {
        id: bookingId,
        eventId: 'event_123',
        status: BOOKING_STATUS.CANCELLED,
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking);

      await expect(bookingService.cancelBooking(bookingId)).rejects.toThrow(
        ConflictError
      );
      await expect(bookingService.cancelBooking(bookingId)).rejects.toThrow(
        'Booking is already cancelled'
      );
    });

    it('should throw NotFoundError when event does not exist', async () => {
      const mockBooking = {
        id: bookingId,
        eventId: 'event_123',
        status: BOOKING_STATUS.CONFIRMED,
        getVersion: jest.fn().mockReturnValue(0),
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking);
      mockEventRepository.findById.mockResolvedValue(null);

      await expect(bookingService.cancelBooking(bookingId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw DatabaseError on repository error', async () => {
      mockBookingRepository.findById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(bookingService.cancelBooking(bookingId)).rejects.toThrow(
        DatabaseError
      );
    });
  });
});


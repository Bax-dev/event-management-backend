const { EventService } = require('../../../src/services/event.service');
const { EventRepository } = require('../../../src/repositories/event.repository');
const { BookingRepository } = require('../../../src/repositories/booking.repository');
const { TransactionUtil } = require('../../../src/utils/transaction.util');
const { CacheUtil } = require('../../../src/utils/cache.util');
const { LockUtil } = require('../../../src/utils/lock.util');
const { IdGeneratorUtil } = require('../../../src/utils/id-generator.util');
const {
  NotFoundError,
  ConcurrencyError,
  DatabaseError,
} = require('../../../src/utils/custom-errors.util');

// Mock dependencies
const mockEventRepositoryInstance = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockBookingRepositoryInstance = {
  getTotalBookedTicketsForEvent: jest.fn(),
};

jest.mock('../../../src/repositories/event.repository', () => {
  return {
    EventRepository: jest.fn(() => mockEventRepositoryInstance),
  };
});
jest.mock('../../../src/repositories/booking.repository', () => {
  return {
    BookingRepository: jest.fn(() => mockBookingRepositoryInstance),
  };
});
jest.mock('../../../src/utils/transaction.util');
jest.mock('../../../src/utils/cache.util');
jest.mock('../../../src/utils/lock.util');
jest.mock('../../../src/utils/id-generator.util');
jest.mock('../../../src/utils/database.connection');

describe('EventService', () => {
  let eventService;
  let mockEventRepository;
  let mockBookingRepository;
  let cacheGetSpy;
  let cacheSetSpy;
  let cacheDeleteSpy;
  let cacheInvalidateSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks first
    TransactionUtil.execute = jest.fn((callback) => callback(null));
    cacheGetSpy = jest.spyOn(CacheUtil, 'get').mockReturnValue(null);
    jest.spyOn(CacheUtil, 'set').mockImplementation(() => {});
    jest.spyOn(CacheUtil, 'delete').mockImplementation(() => {});
    cacheInvalidateSpy = jest.spyOn(CacheUtil, 'invalidatePattern').mockImplementation(() => {});
    LockUtil.withLock = jest.fn((key, callback) => callback());
    jest.spyOn(IdGeneratorUtil, 'generateEventId').mockReturnValue('event_123');
    
    // Create service after mocks are set up
    eventService = new EventService();
    
    // Always replace with our mock instances to ensure they're used
    eventService.repository = mockEventRepositoryInstance;
    eventService.bookingRepository = mockBookingRepositoryInstance;
    
    // Ensure we're using the mock instances
    mockEventRepository = mockEventRepositoryInstance;
    mockBookingRepository = mockBookingRepositoryInstance;

    // Setup default mocks
    TransactionUtil.execute = jest.fn((callback) => callback(null));
    cacheGetSpy = jest.spyOn(CacheUtil, 'get').mockReturnValue(null);
    cacheSetSpy = jest.spyOn(CacheUtil, 'set').mockImplementation(() => {});
    cacheDeleteSpy = jest.spyOn(CacheUtil, 'delete').mockImplementation(() => {});
    cacheInvalidateSpy = jest.spyOn(CacheUtil, 'invalidatePattern').mockImplementation(() => {});
    LockUtil.withLock = jest.fn((key, callback) => callback());
    jest.spyOn(IdGeneratorUtil, 'generateEventId').mockReturnValue('event_123');
  });

  describe('createEvent', () => {
    const validEventData = {
      name: 'Test Event',
      description: 'Test Description',
      totalTickets: 100,
    };

    it('should create an event successfully', async () => {
      const mockEvent = {
        id: 'event_123',
        ...validEventData,
        availableTickets: 100,
        bookedTickets: 0,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEventRepository.create.mockResolvedValue(mockEvent);

      const result = await eventService.createEvent(validEventData);

      expect(IdGeneratorUtil.generateEventId).toHaveBeenCalled();
      expect(TransactionUtil.execute).toHaveBeenCalled();
      expect(mockEventRepository.create).toHaveBeenCalled();
      expect(CacheUtil.delete).toHaveBeenCalledWith('event:event_123');
      expect(CacheUtil.invalidatePattern).toHaveBeenCalledWith('events:*');
      expect(result).toEqual(mockEvent);
    });

    it('should set availableTickets equal to totalTickets on creation', async () => {
      const mockEvent = {
        id: 'event_123',
        ...validEventData,
        availableTickets: 100,
        bookedTickets: 0,
        version: 0,
      };

      mockEventRepository.create.mockResolvedValue(mockEvent);

      await eventService.createEvent(validEventData);

      expect(mockEventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalTickets: 100,
          availableTickets: 100,
          bookedTickets: 0,
        }),
        null
      );
    });

    it('should throw DatabaseError on repository error', async () => {
      mockEventRepository.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(eventService.createEvent(validEventData)).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('getEventById', () => {
    it('should return cached event when available', async () => {
      const cachedEvent = {
        id: 'event_123',
        name: 'Cached Event',
      };

      cacheGetSpy.mockReturnValue(cachedEvent);

      const result = await eventService.getEventById('event_123');

      expect(CacheUtil.get).toHaveBeenCalledWith('event:event_123');
      expect(mockEventRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(cachedEvent);
    });

    it('should fetch from repository and cache when not cached', async () => {
      const mockEvent = {
        id: 'event_123',
        name: 'Test Event',
        totalTickets: 100,
        availableTickets: 50,
      };

      cacheGetSpy.mockReturnValue(null);
      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await eventService.getEventById('event_123');

      expect(mockEventRepository.findById).toHaveBeenCalledWith('event_123');
      expect(CacheUtil.set).toHaveBeenCalledWith(
        'event:event_123',
        mockEvent,
        5 * 60 * 1000
      );
      expect(result).toEqual(mockEvent);
    });

    it('should return null when event not found', async () => {
      cacheGetSpy.mockReturnValue(null);
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await eventService.getEventById('non_existent');

      expect(result).toBeNull();
      expect(CacheUtil.set).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError on repository error', async () => {
      cacheGetSpy.mockReturnValue(null);
      mockEventRepository.findById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(eventService.getEventById('event_123')).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('getAllEvents', () => {
    it('should return cached events when available', async () => {
      const cachedResponse = {
        data: [{ id: 'event_1' }, { id: 'event_2' }],
        pagination: { page: 1, limit: 10, total: 2 },
      };

      cacheGetSpy.mockReturnValue(cachedResponse);

      const result = await eventService.getAllEvents({ page: 1, limit: 10 });

      expect(CacheUtil.get).toHaveBeenCalled();
      expect(mockEventRepository.findAll).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResponse);
    });

    it('should fetch from repository and cache when not cached', async () => {
      const mockEvents = [
        { id: 'event_1', name: 'Event 1', createdAt: new Date(), updatedAt: new Date() },
        { id: 'event_2', name: 'Event 2', createdAt: new Date(), updatedAt: new Date() },
      ];
      const pagination = { page: 1, limit: 10 };

      cacheGetSpy.mockReturnValue(null);
      mockEventRepository.findAll.mockResolvedValue({
        events: mockEvents,
        total: 2,
      });

      const result = await eventService.getAllEvents(pagination);

      expect(mockEventRepository.findAll).toHaveBeenCalledWith(pagination);
      expect(CacheUtil.set).toHaveBeenCalled();
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(2);
    });

    it('should use default pagination when not provided', async () => {
      cacheGetSpy.mockReturnValue(null);
      mockEventRepository.findAll.mockResolvedValue({
        events: [],
        total: 0,
      });

      await eventService.getAllEvents();

      expect(mockEventRepository.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('updateEvent', () => {
    const eventId = 'event_123';
    const updateData = {
      name: 'Updated Event Name',
      description: 'Updated Description',
    };

    it('should update event successfully', async () => {
      const existingEvent = {
        id: eventId,
        name: 'Original Name',
        description: 'Original Description',
        totalTickets: 100,
        availableTickets: 50,
        getVersion: jest.fn().mockReturnValue(0),
        updateAvailableTickets: jest.fn(),
      };

      const updatedEvent = {
        ...existingEvent,
        ...updateData,
        updatedAt: new Date(),
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await eventService.updateEvent(eventId, updateData);

      expect(LockUtil.withLock).toHaveBeenCalled();
      expect(mockEventRepository.findById).toHaveBeenCalledWith(eventId, null);
      expect(mockEventRepository.update).toHaveBeenCalled();
      expect(CacheUtil.delete).toHaveBeenCalledWith(`event:${eventId}`);
      expect(CacheUtil.invalidatePattern).toHaveBeenCalledWith('events:*');
      expect(result).toEqual(updatedEvent);
    });

    it('should throw NotFoundError when event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      await expect(
        eventService.updateEvent(eventId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConcurrencyError when version mismatch', async () => {
      const existingEvent = {
        id: eventId,
        getVersion: jest.fn().mockReturnValue(1),
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);

      await expect(
        eventService.updateEvent(eventId, updateData, 0)
      ).rejects.toThrow(ConcurrencyError);
    });

    it('should update availableTickets when totalTickets changes', async () => {
      const existingEvent = {
        id: eventId,
        name: 'Test Event',
        totalTickets: 100,
        availableTickets: 50,
        bookedTickets: 50,
        getVersion: jest.fn().mockReturnValue(0),
        updateAvailableTickets: jest.fn(),
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(existingEvent);

      await eventService.updateEvent(eventId, { totalTickets: 50 }); // Add 50 to existing 100

      expect(existingEvent.totalTickets).toBe(150); // 100 + 50
      expect(existingEvent.availableTickets).toBe(100); // 50 + 50 (the difference)
    });
  });

  describe('deleteEvent', () => {
    const eventId = 'event_123';

    it('should delete event successfully', async () => {
      const mockEvent = {
        id: eventId,
        name: 'Test Event',
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.delete.mockResolvedValue(true);

      const result = await eventService.deleteEvent(eventId);

      expect(LockUtil.withLock).toHaveBeenCalled();
      expect(mockEventRepository.delete).toHaveBeenCalledWith(eventId, null);
      expect(CacheUtil.delete).toHaveBeenCalledWith(`event:${eventId}`);
      expect(CacheUtil.invalidatePattern).toHaveBeenCalledWith('events:*');
      expect(result).toBe(true);
    });

    it('should return false when event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await eventService.deleteEvent(eventId);

      expect(result).toBe(false);
      expect(mockEventRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError on repository error', async () => {
      mockEventRepository.findById.mockResolvedValue({ id: eventId });
      mockEventRepository.delete.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(eventService.deleteEvent(eventId)).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('getAvailableTickets', () => {
    const eventId = 'event_123';

    it('should return cached result when available', async () => {
      const cachedResult = {
        eventId,
        availableTickets: 50,
        isSoldOut: false,
      };

      cacheGetSpy.mockReturnValue(cachedResult);

      const result = await eventService.getAvailableTickets(eventId);

      expect(result).toEqual(cachedResult);
      expect(mockEventRepository.findById).not.toHaveBeenCalled();
    });

    it('should calculate available tickets from repository', async () => {
      const mockEvent = {
        id: eventId,
        name: 'Test Event',
        totalTickets: 100,
      };

      cacheGetSpy.mockReturnValue(null);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockBookingRepository.getTotalBookedTicketsForEvent.mockResolvedValue(30);

      const result = await eventService.getAvailableTickets(eventId);

      expect(result.availableTickets).toBe(70);
      expect(result.bookedTickets).toBe(30);
      expect(result.totalTickets).toBe(100);
      expect(result.isSoldOut).toBe(false);
      expect(CacheUtil.set).toHaveBeenCalled();
    });

    it('should return isSoldOut true when no tickets available', async () => {
      const mockEvent = {
        id: eventId,
        name: 'Test Event',
        totalTickets: 100,
      };

      cacheGetSpy.mockReturnValue(null);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockBookingRepository.getTotalBookedTicketsForEvent.mockResolvedValue(100);

      const result = await eventService.getAvailableTickets(eventId);

      expect(result.availableTickets).toBe(0);
      expect(result.isSoldOut).toBe(true);
    });

    it('should throw NotFoundError when event does not exist', async () => {
      cacheGetSpy.mockReturnValue(null);
      mockEventRepository.findById.mockResolvedValue(null);

      await expect(
        eventService.getAvailableTickets(eventId)
      ).rejects.toThrow(NotFoundError);
    });
  });
});


import { EventService } from '../../../src/services/event.service';
import { EventRepository } from '../../../src/repositories/event.repository';
import { CreateEventRequest } from '../../../src/types/event.types';

// Mock dependencies
jest.mock('../../../src/utils/event.repository');
jest.mock('../../../src/utils/cache.util');
jest.mock('../../../src/utils/lock.util');

describe('EventService', () => {
  let eventService: EventService;
  let mockRepository: jest.Mocked<EventRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    eventService = new EventService();
    mockRepository = eventService['repository'] as jest.Mocked<EventRepository>;
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      const createData: CreateEventRequest = {
        name: 'Test Event',
        description: 'Test Description',
        totalTickets: 100,
      };

      const mockEvent = {
        id: 'event_123',
        ...createData,
        availableTickets: 100,
        bookedTickets: 0,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockEvent as never);

      const result = await eventService.createEvent(createData);

      expect(result).toBeDefined();
      expect(result.name).toBe(createData.name);
      expect(result.totalTickets).toBe(createData.totalTickets);
    });
  });

  describe('getEventById', () => {
    it('should return event when found', async () => {
      const mockEvent = {
        id: 'event_123',
        name: 'Test Event',
        totalTickets: 100,
        availableTickets: 100,
        bookedTickets: 0,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockEvent as never);

      const result = await eventService.getEventById('event_123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('event_123');
    });

    it('should return null when event not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await eventService.getEventById('non_existent');

      expect(result).toBeNull();
    });
  });
});


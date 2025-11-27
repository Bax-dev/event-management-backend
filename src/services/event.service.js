const { Event } = require('../model/entity/event.entity');
const { EventRepository } = require('../repositories/event.repository');
const { BookingRepository } = require('../repositories/booking.repository');
const { IdGeneratorUtil } = require('../utils/id-generator.util');
const { CacheUtil } = require('../utils/cache.util');
const { LockUtil } = require('../utils/lock.util');
const { TransactionUtil } = require('../utils/transaction.util');
const {
  NotFoundError,
  ConcurrencyError,
  DatabaseError,
  ValidationError,
} = require('../utils/custom-errors.util');
const { EventResponseModel } = require('../model/response/event/event.response');

class EventService {
  constructor() {
    this.repository = new EventRepository();
    this.bookingRepository = new BookingRepository();
  }

  async createEvent(data) {
    try {
      const event = new Event({
        id: IdGeneratorUtil.generateEventId(),
        name: data.name,
        description: data.description,
        totalTickets: data.totalTickets,
        availableTickets: data.totalTickets,
        bookedTickets: 0,
        version: 0,
      });

      const createdEvent = await TransactionUtil.execute(async (client) => {
        return this.repository.create(event, client);
      });

      CacheUtil.delete(`event:${event.id}`);
      CacheUtil.invalidatePattern('events:*');

      return createdEvent;
    } catch (error) {
      throw new DatabaseError('Failed to create event', error);
    }
  }

  async getEventById(id) {
    const cacheKey = `event:${id}`;
    const cached = CacheUtil.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const event = await this.repository.findById(id);

      if (event) {
        CacheUtil.set(cacheKey, event, 5 * 60 * 1000);
      }

      return event;
    } catch (error) {
      throw new DatabaseError('Failed to fetch event', error);
    }
  }

  async getAllEvents(pagination) {
    const cacheKey = `events:list:${JSON.stringify(pagination || {})}`;
    const cached = CacheUtil.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const { events, total } = await this.repository.findAll(pagination);
      const response = EventResponseModel.fromEntities(events);

      const paginatedResponse = {
        data: response,
        pagination: {
          page: pagination?.page || 1,
          limit: pagination?.limit || 10,
          total,
          totalPages: Math.ceil(total / (pagination?.limit || 10)),
          hasNext:
            (pagination?.page || 1) < Math.ceil(total / (pagination?.limit || 10)),
          hasPrev: (pagination?.page || 1) > 1,
        },
      };

      CacheUtil.set(cacheKey, paginatedResponse, 2 * 60 * 1000);

      return paginatedResponse;
    } catch (error) {
      throw new DatabaseError('Failed to fetch events', error);
    }
  }

  async updateEvent(id, data, expectedVersion) {
    const lockKey = `event:update:${id}`;

    return LockUtil.withLock(
      lockKey,
      async () => {
        try {
          const event = await TransactionUtil.execute(async (client) => {
            const currentEvent = await this.repository.findById(id, client);

            if (!currentEvent) {
              throw new NotFoundError('Event', id);
            }

            if (
              expectedVersion !== undefined &&
              currentEvent.getVersion() !== expectedVersion
            ) {
              throw new ConcurrencyError('Event was modified by another operation');
            }

            if (data.name !== undefined) {
              currentEvent.name = data.name;
            }
            if (data.description !== undefined) {
              currentEvent.description = data.description;
            }
            if (data.totalTickets !== undefined) {
              const newTotalTickets = currentEvent.totalTickets + data.totalTickets;
              
              if (newTotalTickets < 0) {
                throw new ValidationError(
                  `Cannot reduce total tickets below 0. Current total: ${currentEvent.totalTickets}, attempting to ${data.totalTickets > 0 ? 'add' : 'remove'} ${Math.abs(data.totalTickets)}, would result in: ${newTotalTickets}`
                );
              }
              
              if (newTotalTickets < currentEvent.bookedTickets) {
                throw new ValidationError(
                  `Cannot reduce total tickets to ${newTotalTickets}. There are ${currentEvent.bookedTickets} tickets already booked.`
                );
              }
              
              if (newTotalTickets > 1000000) {
                throw new ValidationError(
                  `Total tickets cannot exceed 1,000,000. Current total: ${currentEvent.totalTickets}, adding: ${data.totalTickets}, would result in: ${newTotalTickets}`
                );
              }
              
              const previousTotal = currentEvent.totalTickets;
              currentEvent.totalTickets = newTotalTickets;
              const difference = newTotalTickets - previousTotal;
              currentEvent.availableTickets = Math.max(
                0,
                currentEvent.availableTickets + difference
              );
            }

            currentEvent.updatedAt = new Date();
            currentEvent.updateAvailableTickets();

            return this.repository.update(currentEvent, expectedVersion, client);
          });

          CacheUtil.delete(`event:${id}`);
          CacheUtil.invalidatePattern('events:*');

          return event;
        } catch (error) {
          if (
            error instanceof NotFoundError ||
            error instanceof ConcurrencyError ||
            error instanceof ValidationError
          ) {
            throw error;
          }
          throw new DatabaseError('Failed to update event', error);
        }
      },
      30000,
      5000,
      100
    );
  }

  async deleteEvent(id) {
    const lockKey = `event:delete:${id}`;

    return LockUtil.withLock(
      lockKey,
      async () => {
        try {
          const event = await this.getEventById(id);
          if (!event) {
            return false;
          }

          const deleted = await TransactionUtil.execute(async (client) => {
            return this.repository.delete(id, client);
          });

          if (deleted) {
            CacheUtil.delete(`event:${id}`);
            CacheUtil.invalidatePattern('events:*');
          }

          return deleted;
        } catch (error) {
          throw new DatabaseError('Failed to delete event', error);
        }
      },
      30000,
      5000,
      100
    );
  }

  async getAvailableTickets(eventId) {
    const cacheKey = `event:tickets:${eventId}`;
    const cached = CacheUtil.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const event = await this.repository.findById(eventId);
      if (!event) {
        throw new NotFoundError('Event', eventId);
      }

      const bookedTickets = await this.bookingRepository.getTotalBookedTicketsForEvent(
        eventId
      );

      const availableTickets = Math.max(0, event.totalTickets - bookedTickets);
      const isSoldOut = availableTickets === 0;

      const result = {
        eventId: event.id,
        eventName: event.name,
        totalTickets: event.totalTickets,
        bookedTickets,
        availableTickets,
        isSoldOut,
      };

      CacheUtil.set(cacheKey, result, 30 * 1000);

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch available tickets', error);
    }
  }
}

module.exports = { EventService };

const { WaitingList } = require('../model/entity/waiting-list.entity');
const { WaitingListRepository } = require('../repositories/waiting-list.repository');
const { EventRepository } = require('../repositories/event.repository');
const { BookingRepository } = require('../repositories/booking.repository');
const { IdGeneratorUtil } = require('../utils/id-generator.util');
const { CacheUtil } = require('../utils/cache.util');
const { TransactionUtil } = require('../utils/transaction.util');
const { LoggerUtil } = require('../utils/logger.util');
const { WAITING_LIST_STATUS } = require('../constants');
const {
  NotFoundError,
  ConflictError,
  DatabaseError,
} = require('../utils/custom-errors.util');

class WaitingListService {
  constructor() {
    this.waitingListRepository = new WaitingListRepository();
    this.eventRepository = new EventRepository();
    this.bookingRepository = new BookingRepository();
  }

  async addToWaitingList(data) {
    try {
      return await TransactionUtil.execute(async (client) => {
        const event = await this.eventRepository.findById(data.eventId, client);
        if (!event) {
          throw new NotFoundError('Event', data.eventId);
        }

        const existingEntries = await this.waitingListRepository.findByEventId(
          data.eventId,
          undefined,
          client
        );
        const userEntry = existingEntries.find(
          (entry) => entry.userId === data.userId && entry.status === WAITING_LIST_STATUS.PENDING
        );

        if (userEntry) {
          throw new ConflictError(
            'User is already on the waiting list for this event'
          );
        }

        const priority = await this.waitingListRepository.getNextPriority(
          data.eventId
        );

        const waitingListEntry = new WaitingList({
          id: IdGeneratorUtil.generateId(),
          eventId: data.eventId,
          userId: data.userId,
          numberOfTickets: data.numberOfTickets,
          priority,
          status: WAITING_LIST_STATUS.PENDING,
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const created = await this.waitingListRepository.create(
          waitingListEntry,
          client
        );

        CacheUtil.invalidatePattern('waiting-list:*');

        return created;
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to add to waiting list', error);
    }
  }

  async processWaitingList(eventId) {
    try {
      return await TransactionUtil.execute(async (client) => {
        const event = await this.eventRepository.findById(eventId, client);
        if (!event) {
          throw new NotFoundError('Event', eventId);
        }

        const totalBooked =
          await this.bookingRepository.getTotalBookedTicketsForEvent(
            eventId,
            client
          );
        const availableTickets = event.totalTickets - totalBooked;

        if (availableTickets <= 0) {
          LoggerUtil.info(`No tickets available for event ${eventId}`);
          return 0;
        }

        const pendingEntries = await this.waitingListRepository.findByEventId(
          eventId,
          WAITING_LIST_STATUS.PENDING,
          client
        );

        if (pendingEntries.length === 0) {
          LoggerUtil.info(`No pending entries in waiting list for event ${eventId}`);
          return 0;
        }

        let notifiedCount = 0;
        let remainingTickets = availableTickets;

        for (const entry of pendingEntries) {
          if (remainingTickets < entry.numberOfTickets) {
            break;
          }

          entry.status = WAITING_LIST_STATUS.NOTIFIED;
          entry.notifiedAt = new Date();
          entry.updatedAt = new Date();

          await this.waitingListRepository.update(
            entry,
            entry.getVersion(),
            client
          );

          remainingTickets -= entry.numberOfTickets;
          notifiedCount++;

          LoggerUtil.info(
            `Notified waiting list entry ${entry.id} for event ${eventId}. User: ${entry.userId}, Tickets: ${entry.numberOfTickets}`
          );
        }

        if (notifiedCount > 0) {
          CacheUtil.invalidatePattern('waiting-list:*');
        }

        return notifiedCount;
      });
    } catch (error) {
      LoggerUtil.error('Error processing waiting list', error);
      throw new DatabaseError('Failed to process waiting list', error);
    }
  }

  async getWaitingListByEventId(eventId) {
    const cacheKey = `waiting-list:event:${eventId}`;
    const cached = CacheUtil.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const entries = await this.waitingListRepository.findByEventId(eventId);

      CacheUtil.set(cacheKey, entries, 2 * 60 * 1000);

      return entries;
    } catch (error) {
      throw new DatabaseError('Failed to fetch waiting list', error);
    }
  }

  async getWaitingListById(id) {
    const cacheKey = `waiting-list:${id}`;
    const cached = CacheUtil.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const entry = await this.waitingListRepository.findById(id);

      if (entry) {
        CacheUtil.set(cacheKey, entry, 5 * 60 * 1000);
      }

      return entry;
    } catch (error) {
      throw new DatabaseError('Failed to fetch waiting list entry', error);
    }
  }

  async cancelWaitingListEntry(id) {
    try {
      return await TransactionUtil.execute(async (client) => {
        const entry = await this.waitingListRepository.findById(id, client);

        if (!entry) {
          throw new NotFoundError('Waiting list entry', id);
        }

        if (entry.status === WAITING_LIST_STATUS.CANCELLED) {
          throw new ConflictError('Waiting list entry is already cancelled');
        }

        entry.status = WAITING_LIST_STATUS.CANCELLED;
        entry.updatedAt = new Date();

        const updated = await this.waitingListRepository.update(
          entry,
          entry.getVersion(),
          client
        );

        CacheUtil.delete(`waiting-list:${id}`);
        CacheUtil.invalidatePattern('waiting-list:*');

        return updated;
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to cancel waiting list entry', error);
    }
  }
}

module.exports = { WaitingListService };

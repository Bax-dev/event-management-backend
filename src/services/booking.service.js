const { Booking } = require('../model/entity/booking.entity');
const { BookingRepository } = require('../repositories/booking.repository');
const { EventRepository } = require('../repositories/event.repository');
const { IdGeneratorUtil } = require('../utils/id-generator.util');
const { CacheUtil } = require('../utils/cache.util');
const { LockUtil } = require('../utils/lock.util');
const { TransactionUtil } = require('../utils/transaction.util');
const { LoggerUtil } = require('../utils/logger.util');
const { BOOKING_STATUS, WAITING_LIST_STATUS } = require('../constants');
const {
  NotFoundError,
  ConcurrencyError,
  DatabaseError,
  ConflictError,
} = require('../utils/custom-errors.util');

class BookingService {
  constructor() {
    this.bookingRepository = new BookingRepository();
    this.eventRepository = new EventRepository();
  }

  async createBooking(data) {
    return TransactionUtil.withRetry(
      async () => {
        return await TransactionUtil.execute(async (client) => {
          const event = await this.eventRepository.findById(data.eventId, client);

          if (!event) {
            throw new NotFoundError('Event', data.eventId);
          }

          const totalBooked =
            await this.bookingRepository.getTotalBookedTicketsForEvent(
              data.eventId,
              client
            );
          const availableTickets = event.totalTickets - totalBooked;

          if (availableTickets < data.numberOfTickets) {
            throw new ConflictError(
              `Not enough tickets available. Available: ${availableTickets}, Requested: ${data.numberOfTickets}`
            );
          }

          const booking = new Booking({
            id: IdGeneratorUtil.generateId(),
            eventId: data.eventId,
            userId: data.userId,
            numberOfTickets: data.numberOfTickets,
            status: BOOKING_STATUS.CONFIRMED,
            version: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          const createdBooking = await this.bookingRepository.create(booking, client);

          const newTotalBooked =
            await this.bookingRepository.getTotalBookedTicketsForEvent(
              data.eventId,
              client
            );
          event.bookedTickets = newTotalBooked;
          event.availableTickets = event.totalTickets - newTotalBooked;
          event.updatedAt = new Date();
          event.updateAvailableTickets();

          await this.eventRepository.update(event, event.getVersion(), client);

          CacheUtil.delete(`event:${data.eventId}`);
          CacheUtil.invalidatePattern('events:*');
          CacheUtil.invalidatePattern('bookings:*');

          return createdBooking;
        });
      },
      3,
      100
    ).catch((error) => {
      if (
        error instanceof NotFoundError ||
        error instanceof ConflictError ||
        error instanceof ConcurrencyError
      ) {
        throw error;
      }
      throw new DatabaseError('Failed to create booking', error);
    });
  }

  async getBookingById(id) {
    const cacheKey = `booking:${id}`;
    const cached = CacheUtil.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const booking = await this.bookingRepository.findById(id);

      if (booking) {
        CacheUtil.set(cacheKey, booking, 5 * 60 * 1000);
      }

      return booking;
    } catch (error) {
      throw new DatabaseError('Failed to fetch booking', error);
    }
  }

  async getBookingsByEventId(eventId) {
    const cacheKey = `bookings:event:${eventId}`;
    const cached = CacheUtil.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await this.bookingRepository.findByEventId(eventId);

      CacheUtil.set(cacheKey, result, 2 * 60 * 1000);

      return result;
    } catch (error) {
      throw new DatabaseError('Failed to fetch bookings', error);
    }
  }

  async cancelBooking(id) {
    const lockKey = `booking:cancel:${id}`;

    return LockUtil.withLock(
      lockKey,
      async () => {
        try {
          return await TransactionUtil.execute(async (client) => {
            const booking = await this.bookingRepository.findById(id, client);

            if (!booking) {
              throw new NotFoundError('Booking', id);
            }

            if (booking.status === BOOKING_STATUS.CANCELLED) {
              throw new ConflictError('Booking is already cancelled');
            }

            const event = await this.eventRepository.findById(
              booking.eventId,
              client
            );

            if (!event) {
              throw new NotFoundError('Event', booking.eventId);
            }

            booking.status = BOOKING_STATUS.CANCELLED;
            booking.updatedAt = new Date();

            const updatedBooking = await this.bookingRepository.update(
              booking,
              booking.getVersion(),
              client
            );

            const totalBooked =
              await this.bookingRepository.getTotalBookedTicketsForEvent(
                booking.eventId,
                client
              );
            event.bookedTickets = totalBooked;
            event.availableTickets = event.totalTickets - totalBooked;
            event.updatedAt = new Date();
            event.updateAvailableTickets();

            await this.eventRepository.update(event, event.getVersion(), client);

            CacheUtil.delete(`booking:${id}`);
            CacheUtil.delete(`event:${booking.eventId}`);
            CacheUtil.invalidatePattern('events:*');
            CacheUtil.invalidatePattern('bookings:*');

            setImmediate(async () => {
              try {
                await this.processWaitingListAfterCancellation(booking.eventId);
              } catch (error) {
                LoggerUtil.error(
                  'Error processing waiting list after cancellation',
                  error
                );
              }
            });

            return updatedBooking;
          });
        } catch (error) {
          if (
            error instanceof NotFoundError ||
            error instanceof ConflictError ||
            error instanceof ConcurrencyError
          ) {
            throw error;
          }
          throw new DatabaseError('Failed to cancel booking', error);
        }
      },
      30000,
      5000,
      100
    );
  }

  async processWaitingListAfterCancellation(eventId) {
    try {
      const { WaitingListService } = await import('./waiting-list.service');
      const waitingListService = new WaitingListService();

      const notifiedCount = await waitingListService.processWaitingList(eventId);

      if (notifiedCount === 0) {
        LoggerUtil.info(`No waiting list entries to process for event ${eventId}`);
        return;
      }

      LoggerUtil.info(
        `Processing ${notifiedCount} waiting list entries for event ${eventId}`
      );

      await this.autoFulfillWaitingList(eventId);
    } catch (error) {
      LoggerUtil.error('Error in processWaitingListAfterCancellation', error);
      throw error;
    }
  }

  async autoFulfillWaitingList(eventId) {
    try {
      const { WaitingListRepository } = await import(
        '../repositories/waiting-list.repository'
      );
      const waitingListRepo = new WaitingListRepository();

      const notifiedEntries = await waitingListRepo.findByEventId(
        eventId,
        WAITING_LIST_STATUS.NOTIFIED
      );

      if (notifiedEntries.length === 0) {
        LoggerUtil.info(`No notified entries to fulfill for event ${eventId}`);
        return;
      }

      LoggerUtil.info(
        `Attempting to auto-fulfill ${notifiedEntries.length} waiting list entries for event ${eventId}`
      );

      let fulfilledCount = 0;
      let failedCount = 0;

      for (const entry of notifiedEntries) {
        try {
          const event = await this.eventRepository.findById(eventId);
          if (!event) {
            LoggerUtil.warn(`Event ${eventId} not found during auto-fulfillment`);
            break;
          }

          const totalBooked =
            await this.bookingRepository.getTotalBookedTicketsForEvent(eventId);
          const availableTickets = event.totalTickets - totalBooked;

          if (availableTickets < entry.numberOfTickets) {
            LoggerUtil.info(
              `Insufficient tickets for waiting list entry ${entry.id}. Available: ${availableTickets}, Required: ${entry.numberOfTickets}`
            );
            continue;
          }

          await TransactionUtil.withRetry(
            async () => {
              await this.createBooking({
                eventId,
                userId: entry.userId,
                numberOfTickets: entry.numberOfTickets,
              });
            },
            3,
            100
          );

          entry.status = WAITING_LIST_STATUS.FULFILLED;
          entry.fulfilledAt = new Date();
          entry.updatedAt = new Date();

          await waitingListRepo.update(entry, entry.getVersion());

          fulfilledCount++;
          LoggerUtil.info(
            `Successfully fulfilled waiting list entry ${entry.id} for user ${entry.userId}`
          );
        } catch (error) {
          failedCount++;
          LoggerUtil.error(
            `Failed to auto-fulfill waiting list entry ${entry.id} for user ${entry.userId}`,
            error
          );

          if (error instanceof ConflictError) {
            try {
              entry.status = WAITING_LIST_STATUS.PENDING;
              entry.notifiedAt = undefined;
              entry.updatedAt = new Date();
              await waitingListRepo.update(entry, entry.getVersion());
              LoggerUtil.info(
                `Reset waiting list entry ${entry.id} to pending due to insufficient tickets`
              );
            } catch (updateError) {
              LoggerUtil.error(
                `Failed to reset waiting list entry ${entry.id} to pending`,
                updateError
              );
            }
          }
        }
      }

      LoggerUtil.info(
        `Auto-fulfillment completed for event ${eventId}. Fulfilled: ${fulfilledCount}, Failed: ${failedCount}`
      );
    } catch (error) {
      LoggerUtil.error('Error in autoFulfillWaitingList', error);
      throw error;
    }
  }
}

module.exports = { BookingService };

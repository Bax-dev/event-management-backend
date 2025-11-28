const { EventService } = require('../services/event.service');
const { BookingService } = require('../services/booking.service');
const { WaitingListService } = require('../services/waiting-list.service');
const { ResponseUtil, ErrorHandlerUtil } = require('../utils');
const { ConflictError } = require('../utils/custom-errors.util');
const { auditLogUtil } = require('../utils/audit-log.util');
const { AUDIT_ACTION } = require('../constants');

class TicketController {
  constructor() {
    this.eventService = new EventService();
    this.bookingService = new BookingService();
    this.waitingListService = new WaitingListService();
  }

  initializeEvent = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { name, description, totalTickets } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      ResponseUtil.validationError(res, ['Event name is required']);
      return;
    }

    if (!totalTickets || typeof totalTickets !== 'number' || totalTickets <= 0) {
      ResponseUtil.validationError(res, ['Total tickets must be a positive number']);
      return;
    }

    if (totalTickets > 1000000) {
      ResponseUtil.validationError(res, ['Total tickets cannot exceed 1,000,000']);
      return;
    }

    const event = await this.eventService.createEvent({
      name: name.trim(),
      description: description?.trim(),
      totalTickets,
    });

    await auditLogUtil.logSuccess(req, AUDIT_ACTION.EVENT_INITIALIZED, {
      entityType: 'event',
      entityId: event.id,
      description: `Event "${event.name}" initialized with ${totalTickets} tickets`,
      metadata: {
        name: event.name,
        totalTickets: event.totalTickets,
      },
    });

    ResponseUtil.created(res, {
      eventId: event.id,
      name: event.name,
      totalTickets: event.totalTickets,
      availableTickets: event.availableTickets,
      message: 'Event initialized successfully',
    });
  });

  bookTicket = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { eventId, numberOfTickets } = req.body;
    const userId = req.user?.id;

    // Validation
    if (!userId) {
      ResponseUtil.error(res, 'Authentication required', 401);
      return;
    }

    if (!eventId || typeof eventId !== 'string') {
      ResponseUtil.validationError(res, ['Event ID is required']);
      return;
    }

    if (!numberOfTickets || typeof numberOfTickets !== 'number' || numberOfTickets <= 0) {
      ResponseUtil.validationError(res, ['Number of tickets must be a positive number']);
      return;
    }

    if (!Number.isInteger(numberOfTickets)) {
      ResponseUtil.validationError(res, ['Number of tickets must be an integer']);
      return;
    }

    try {
      const booking = await this.bookingService.createBooking({
        eventId,
        userId,
        numberOfTickets,
      });

      await auditLogUtil.logSuccess(req, AUDIT_ACTION.BOOKING_CREATED, {
        entityType: 'booking',
        entityId: booking.id,
        description: `User booked ${numberOfTickets} ticket(s) for event`,
        metadata: {
          eventId: booking.eventId,
          numberOfTickets: booking.numberOfTickets,
          status: booking.status,
        },
      });

      ResponseUtil.created(res, {
        bookingId: booking.id,
        eventId: booking.eventId,
        userId: booking.userId,
        numberOfTickets: booking.numberOfTickets,
        status: booking.status,
        message: 'Tickets booked successfully',
      });
    } catch (error) {
      if (error instanceof ConflictError && error.message.includes('available')) {
        try {
          const waitingListEntry = await this.waitingListService.addToWaitingList({
            eventId,
            userId,
            numberOfTickets,
          });

          await auditLogUtil.logSuccess(req, AUDIT_ACTION.WAITING_LIST_ADDED, {
            entityType: 'waiting_list',
            entityId: waitingListEntry.id,
            description: `User added to waiting list for ${numberOfTickets} ticket(s)`,
            metadata: {
              eventId: waitingListEntry.eventId,
              numberOfTickets: waitingListEntry.numberOfTickets,
              priority: waitingListEntry.priority,
            },
          });

          ResponseUtil.created(res, {
            waitingListId: waitingListEntry.id,
            eventId: waitingListEntry.eventId,
            userId: waitingListEntry.userId,
            numberOfTickets: waitingListEntry.numberOfTickets,
            status: waitingListEntry.status,
            position: waitingListEntry.priority,
            message: 'Event is sold out. You have been added to the waiting list.',
          });
          return;
        } catch (waitingListError) {
          throw error;
        }
      }
      throw error;
    }
  });

  cancelBooking = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { bookingId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      ResponseUtil.error(res, 'Authentication required', 401);
      return;
    }

    if (!bookingId || typeof bookingId !== 'string') {
      ResponseUtil.validationError(res, ['Booking ID is required']);
      return;
    }

    const booking = await this.bookingService.getBookingById(bookingId);

    if (!booking) {
      ResponseUtil.notFound(res, 'Booking not found');
      return;
    }

    if (booking.userId !== userId) {
      ResponseUtil.error(res, 'You can only cancel your own bookings', 403);
      return;
    }

    const cancelledBooking = await this.bookingService.cancelBooking(bookingId);

    await auditLogUtil.logSuccess(req, AUDIT_ACTION.BOOKING_CANCELLED, {
      entityType: 'booking',
      entityId: cancelledBooking.id,
      description: `Booking cancelled for event ${cancelledBooking.eventId}`,
      metadata: {
        eventId: cancelledBooking.eventId,
        userId: cancelledBooking.userId,
        numberOfTickets: cancelledBooking.numberOfTickets,
      },
    });

    ResponseUtil.success(res, {
      bookingId: cancelledBooking.id,
      eventId: cancelledBooking.eventId,
      userId: cancelledBooking.userId,
      status: cancelledBooking.status,
      message:
        'Booking cancelled successfully. Waiting list users will be notified automatically if tickets become available.',
    });
  });

  getEventStatus = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { eventId } = req.params;

    if (!eventId) {
      ResponseUtil.validationError(res, ['Event ID is required']);
      return;
    }

    const ticketsInfo = await this.eventService.getAvailableTickets(eventId);

    const waitingListEntries = await this.waitingListService.getWaitingListByEventId(eventId);

    const { WAITING_LIST_STATUS } = require('../constants');

    const pendingCount = waitingListEntries.filter(
      entry => entry.status === WAITING_LIST_STATUS.PENDING
    ).length;

    ResponseUtil.success(res, {
      eventId: ticketsInfo.eventId,
      eventName: ticketsInfo.eventName,
      totalTickets: ticketsInfo.totalTickets,
      bookedTickets: ticketsInfo.bookedTickets,
      availableTickets: ticketsInfo.availableTickets,
      isSoldOut: ticketsInfo.isSoldOut,
      waitingListCount: pendingCount,
      waitingListEntries: waitingListEntries
        .filter(entry => entry.status === WAITING_LIST_STATUS.PENDING)
        .map(entry => ({
          id: entry.id,
          userId: entry.userId,
          numberOfTickets: entry.numberOfTickets,
          position: entry.priority,
          createdAt: entry.createdAt.toISOString(),
        })),
    });
  });
}

module.exports = { TicketController };

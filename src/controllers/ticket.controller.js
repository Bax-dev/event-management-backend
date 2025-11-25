const { EventService } = require('../services/event.service');
const { BookingService } = require('../services/booking.service');
const { WaitingListService } = require('../services/waiting-list.service');
const { ResponseUtil, ErrorHandlerUtil } = require('../utils');
const { ConflictError } = require('../utils/custom-errors.util');
const { AuthMiddleware } = require('../middleware/auth.middleware');

class TicketController {
  constructor() {
    this.eventService = new EventService();
    this.bookingService = new BookingService();
    this.waitingListService = new WaitingListService();
  }

  /**
   * POST /initialize
   * Initialize a new event with a given number of tickets
   */
  initializeEvent = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { name, description, totalTickets } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      ResponseUtil.validationError(res, ['Event name is required']);
      return;
    }

    if (!totalTickets || typeof totalTickets !== 'number' || totalTickets <= 0) {
      ResponseUtil.validationError(res, [
        'Total tickets must be a positive number',
      ]);
      return;
    }

    if (totalTickets > 1000000) {
      ResponseUtil.validationError(res, [
        'Total tickets cannot exceed 1,000,000',
      ]);
      return;
    }

    const event = await this.eventService.createEvent({
      name: name.trim(),
      description: description?.trim(),
      totalTickets,
    });

    ResponseUtil.created(res, {
      eventId: event.id,
      name: event.name,
      totalTickets: event.totalTickets,
      availableTickets: event.availableTickets,
      message: 'Event initialized successfully',
    });
  });

  /**
   * POST /book
   * Book a ticket for a user
   * If sold out, add the user to the waiting list
   */
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

    if (
      !numberOfTickets ||
      typeof numberOfTickets !== 'number' ||
      numberOfTickets <= 0
    ) {
      ResponseUtil.validationError(res, [
        'Number of tickets must be a positive number',
      ]);
      return;
    }

    if (!Number.isInteger(numberOfTickets)) {
      ResponseUtil.validationError(res, [
        'Number of tickets must be an integer',
      ]);
      return;
    }

    try {
      // Try to create booking
      const booking = await this.bookingService.createBooking({
        eventId,
        userId,
        numberOfTickets,
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
      // If sold out, add to waiting list
      if (error instanceof ConflictError && error.message.includes('available')) {
        try {
          const waitingListEntry = await this.waitingListService.addToWaitingList(
            {
              eventId,
              userId,
              numberOfTickets,
            }
          );

          ResponseUtil.created(res, {
            waitingListId: waitingListEntry.id,
            eventId: waitingListEntry.eventId,
            userId: waitingListEntry.userId,
            numberOfTickets: waitingListEntry.numberOfTickets,
            status: waitingListEntry.status,
            position: waitingListEntry.priority,
            message:
              'Event is sold out. You have been added to the waiting list.',
          });
          return;
        } catch (waitingListError) {
          // If waiting list addition fails, return original error
          throw error;
        }
      }
      throw error;
    }
  });


  cancelBooking = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { bookingId } = req.body;
    const userId = req.user?.id;

    // Validation
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

    // Get available tickets info
    const ticketsInfo = await this.eventService.getAvailableTickets(eventId);

    // Get waiting list entries
    const waitingListEntries = await this.waitingListService.getWaitingListByEventId(
      eventId
    );

    const { WAITING_LIST_STATUS } = require('../constants');
    
    // Count pending entries
    const pendingCount = waitingListEntries.filter(
      (entry) => entry.status === WAITING_LIST_STATUS.PENDING
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
        .filter((entry) => entry.status === WAITING_LIST_STATUS.PENDING)
        .map((entry) => ({
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

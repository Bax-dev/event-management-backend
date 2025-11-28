const { BookingService } = require('../services/booking.service');
const { CreateBookingRequestModel } = require('../model/request/booking/create-booking.request');
const { BookingResponseModel } = require('../model/response/booking/booking.response');
const { ResponseUtil, ErrorHandlerUtil } = require('../utils');

class BookingController {
  constructor() {
    this.bookingService = new BookingService();
  }

  createBooking = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const createRequest = new CreateBookingRequestModel(req.body);
    const validation = createRequest.validate();

    if (!validation.isValid) {
      ResponseUtil.validationError(res, validation.errors);
      return;
    }

    const booking = await this.bookingService.createBooking(createRequest);
    const response = BookingResponseModel.fromEntity(booking);

    ResponseUtil.created(res, response, 'Booking created successfully');
  });

  getBookingById = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { id } = req.params;

    const booking = await this.bookingService.getBookingById(id);

    if (!booking) {
      ResponseUtil.notFound(res, 'Booking not found');
      return;
    }

    const response = BookingResponseModel.fromEntity(booking);
    ResponseUtil.success(res, response);
  });

  getBookingsByEventId = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { eventId } = req.params;

    const result = await this.bookingService.getBookingsByEventId(eventId);
    const response = BookingResponseModel.fromEntities(result.bookings);

    ResponseUtil.withCount(res, response);
  });

  cancelBooking = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { id } = req.params;

    const booking = await this.bookingService.cancelBooking(id);
    const response = BookingResponseModel.fromEntity(booking);

    ResponseUtil.success(
      res,
      response,
      'Booking cancelled successfully. Waiting list users will be notified automatically.'
    );
  });
}

module.exports = { BookingController };

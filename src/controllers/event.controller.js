const { EventService } = require('../services/event.service');
const { UpdateEventRequestModel } = require('../model/request/event/update-event.request');
const { EventResponseModel } = require('../model/response/event/event.response');
const {
  ResponseUtil,
  ErrorHandlerUtil,
  PaginationUtil,
} = require('../utils');

class EventController {
  constructor() {
    this.eventService = new EventService();
  }

  getEventById = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { id } = req.params;

    const event = await this.eventService.getEventById(id);

    if (!event) {
      ResponseUtil.notFound(res, 'Event not found');
      return;
    }

    const response = EventResponseModel.fromEntity(event);
    ResponseUtil.success(res, response);
  });

  getAllEvents = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const pagination = PaginationUtil.parseParams(req.query);
    const result = await this.eventService.getAllEvents(pagination);

    ResponseUtil.success(res, result);
  });

  updateEvent = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { id } = req.params;
    const updateRequest = new UpdateEventRequestModel(req.body);
    const validation = updateRequest.validate();

    if (!validation.isValid) {
      ResponseUtil.validationError(res, validation.errors);
      return;
    }
    const ifMatch = req.headers['if-match'];
    const expectedVersion = ifMatch
      ? parseInt(String(ifMatch), 10)
      : undefined;

    const event = await this.eventService.updateEvent(id, updateRequest, expectedVersion);

    const response = EventResponseModel.fromEntity(event);
    res.setHeader('ETag', String(event.getVersion()));
    ResponseUtil.success(res, response, 'Event updated successfully');
  });

  deleteEvent = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { id } = req.params;

    const deleted = await this.eventService.deleteEvent(id);

    if (!deleted) {
      ResponseUtil.notFound(res, 'Event not found');
      return;
    }

    ResponseUtil.success(res, undefined, 'Event deleted successfully');
  });

  getAvailableTickets = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { id } = req.params;

    const ticketsInfo = await this.eventService.getAvailableTickets(id);

    ResponseUtil.success(res, ticketsInfo);
  });
}

module.exports = { EventController };

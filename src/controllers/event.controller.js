const { EventService } = require('../services/event.service');
const { CreateEventRequestModel } = require('../model/request/event/create-event.request');
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

  createEvent = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const createRequest = new CreateEventRequestModel(req.body);
    const validation = createRequest.validate();

    if (!validation.isValid) {
      ResponseUtil.validationError(res, validation.errors);
      return;
    }

    const event = await this.eventService.createEvent(createRequest);
    const response = EventResponseModel.fromEntity(event);

    ResponseUtil.created(res, response, 'Event created successfully');
  });

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

    // Support optimistic locking via If-Match header
    const ifMatch = req.headers['if-match'];
    const expectedVersion = ifMatch
      ? parseInt(String(ifMatch), 10)
      : undefined;

    const event = await this.eventService.updateEvent(id, updateRequest, expectedVersion);

    const response = EventResponseModel.fromEntity(event);
    // Include ETag for optimistic locking
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

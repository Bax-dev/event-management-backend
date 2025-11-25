const { WaitingListService } = require('../services/waiting-list.service');
const { CreateWaitingListRequestModel } = require('../model/request/waiting-list/create-waiting-list.request');
const { WaitingListResponseModel } = require('../model/response/waiting-list/waiting-list.response');
const { ResponseUtil, ErrorHandlerUtil } = require('../utils');

class WaitingListController {
  constructor() {
    this.waitingListService = new WaitingListService();
  }

  addToWaitingList = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const createRequest = new CreateWaitingListRequestModel(req.body);
    const validation = createRequest.validate();

    if (!validation.isValid) {
      ResponseUtil.validationError(res, validation.errors);
      return;
    }

    const entry = await this.waitingListService.addToWaitingList(createRequest);
    const response = WaitingListResponseModel.fromEntity(entry);

    ResponseUtil.created(res, response, 'Successfully added to waiting list');
  });

  getWaitingListByEventId = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { eventId } = req.params;

    const entries = await this.waitingListService.getWaitingListByEventId(eventId);
    const response = WaitingListResponseModel.fromEntities(entries);

    ResponseUtil.withCount(res, response);
  });

  getWaitingListById = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { id } = req.params;

    const entry = await this.waitingListService.getWaitingListById(id);

    if (!entry) {
      ResponseUtil.notFound(res, 'Waiting list entry not found');
      return;
    }

    const response = WaitingListResponseModel.fromEntity(entry);
    ResponseUtil.success(res, response);
  });

  cancelWaitingListEntry = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { id } = req.params;

    const entry = await this.waitingListService.cancelWaitingListEntry(id);
    const response = WaitingListResponseModel.fromEntity(entry);

    ResponseUtil.success(res, response, 'Waiting list entry cancelled successfully');
  });

  processWaitingList = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { eventId } = req.params;

    await this.waitingListService.processWaitingList(eventId);

    ResponseUtil.success(res, undefined, 'Waiting list processed successfully');
  });
}

module.exports = { WaitingListController };

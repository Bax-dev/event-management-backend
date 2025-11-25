const { OrderService } = require('../services/order.service');
const { CreateOrderRequestModel } = require('../model/request/order/create-order.request');
const { UpdateOrderRequestModel } = require('../model/request/order/update-order.request');
const { OrderResponseModel } = require('../model/response/order/order.response');
const { ResponseUtil, ErrorHandlerUtil } = require('../utils');

class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  createOrder = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const createRequest = new CreateOrderRequestModel(req.body);
    const validation = createRequest.validate();

    if (!validation.isValid) {
      ResponseUtil.validationError(res, validation.errors);
      return;
    }

    const order = await this.orderService.createOrder(createRequest);
    const response = OrderResponseModel.fromEntity(order);

    ResponseUtil.created(res, response, 'Order created successfully');
  });

  getOrderById = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { id } = req.params;

    const order = await this.orderService.getOrderById(id);

    if (!order) {
      ResponseUtil.notFound(res, 'Order not found');
      return;
    }

    const response = OrderResponseModel.fromEntity(order);
    ResponseUtil.success(res, response);
  });

  getOrdersByUserId = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { userId } = req.params;

    const orders = await this.orderService.getOrdersByUserId(userId);
    const response = OrderResponseModel.fromEntities(orders);

    ResponseUtil.withCount(res, response);
  });

  updateOrder = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const { id } = req.params;
    const updateRequest = new UpdateOrderRequestModel(req.body);
    const validation = updateRequest.validate();

    if (!validation.isValid) {
      ResponseUtil.validationError(res, validation.errors);
      return;
    }

    const order = await this.orderService.updateOrder(id, updateRequest);
    const response = OrderResponseModel.fromEntity(order);

    ResponseUtil.success(res, response, 'Order updated successfully');
  });
}

module.exports = { OrderController };

const { Order } = require('../model/entity/order.entity');
const { OrderRepository } = require('../repositories/order.repository');
const { BookingRepository } = require('../repositories/booking.repository');
const { IdGeneratorUtil } = require('../utils/id-generator.util');
const { CacheUtil } = require('../utils/cache.util');
const { TransactionUtil } = require('../utils/transaction.util');
const { ORDER_STATUS } = require('../constants');
const {
  NotFoundError,
  ConflictError,
  DatabaseError,
} = require('../utils/custom-errors.util');

class OrderService {
  constructor() {
    this.repository = new OrderRepository();
    this.bookingRepository = new BookingRepository();
  }

  async createOrder(data) {
    try {
      return await TransactionUtil.execute(async (client) => {
        const booking = await this.bookingRepository.findById(
          data.bookingId,
          client
        );
        if (!booking) {
          throw new NotFoundError('Booking', data.bookingId);
        }

        const existingOrder = await this.repository.findByBookingId(
          data.bookingId
        );
        if (existingOrder) {
          throw new ConflictError('Order already exists for this booking');
        }

        const orderNumber = this.generateOrderNumber();

        const order = new Order({
          id: IdGeneratorUtil.generateId(),
          userId: data.userId,
          eventId: data.eventId,
          bookingId: data.bookingId,
          orderNumber,
          totalAmount: data.totalAmount,
          currency: data.currency || 'NGN',
          status: ORDER_STATUS.PENDING,
          paymentStatus: ORDER_STATUS.PENDING,
          paymentMethod: data.paymentMethod,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          billingAddress: data.billingAddress,
          notes: data.notes,
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const createdOrder = await this.repository.create(order, client);

        CacheUtil.delete(`order:${order.id}`);
        CacheUtil.invalidatePattern('orders:*');
        CacheUtil.invalidatePattern(`orders:user:${data.userId}:*`);

        return createdOrder;
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to create order', error);
    }
  }

  async getOrderById(id) {
    const cacheKey = `order:${id}`;
    const cached = CacheUtil.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const order = await this.repository.findById(id);

      if (order) {
        CacheUtil.set(cacheKey, order, 5 * 60 * 1000);
      }

      return order;
    } catch (error) {
      throw new DatabaseError('Failed to fetch order', error);
    }
  }

  async getOrdersByUserId(userId) {
    try {
      const result = await this.repository.findByUserId(userId);
      return result.orders;
    } catch (error) {
      throw new DatabaseError('Failed to fetch orders', error);
    }
  }

  async updateOrder(id, data) {
    try {
      return await TransactionUtil.execute(async (client) => {
        const order = await this.repository.findById(id, client);

        if (!order) {
          throw new NotFoundError('Order', id);
        }

        if (data.status !== undefined) order.status = data.status;
        if (data.paymentStatus !== undefined)
          order.paymentStatus = data.paymentStatus;
        if (data.paymentMethod !== undefined)
          order.paymentMethod = data.paymentMethod;
        if (data.paymentTransactionId !== undefined)
          order.paymentTransactionId = data.paymentTransactionId;
        if (data.customerName !== undefined)
          order.customerName = data.customerName;
        if (data.customerEmail !== undefined)
          order.customerEmail = data.customerEmail;
        if (data.customerPhone !== undefined)
          order.customerPhone = data.customerPhone;
        if (data.billingAddress !== undefined)
          order.billingAddress = data.billingAddress;
        if (data.notes !== undefined) order.notes = data.notes;

        if (data.status === ORDER_STATUS.PAID && order.status !== ORDER_STATUS.PAID) {
          order.markAsPaid(data.paymentTransactionId);
        } else if (data.status === ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.CANCELLED) {
          order.markAsCancelled();
        } else {
          order.updatedAt = new Date();
        }

        const updatedOrder = await this.repository.update(
          order,
          order.getVersion(),
          client
        );

        CacheUtil.delete(`order:${id}`);
        CacheUtil.invalidatePattern('orders:*');
        CacheUtil.invalidatePattern(`orders:user:${order.userId}:*`);

        return updatedOrder;
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update order', error);
    }
  }

  generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}

module.exports = { OrderService };

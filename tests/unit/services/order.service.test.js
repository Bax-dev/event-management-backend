const { OrderService } = require('../../../src/services/order.service');
const { OrderRepository } = require('../../../src/repositories/order.repository');
const { BookingRepository } = require('../../../src/repositories/booking.repository');
const { TransactionUtil } = require('../../../src/utils/transaction.util');
const { CacheUtil } = require('../../../src/utils/cache.util');
const { IdGeneratorUtil } = require('../../../src/utils/id-generator.util');
const { ORDER_STATUS } = require('../../../src/constants');
const {
  NotFoundError,
  ConflictError,
  DatabaseError,
} = require('../../../src/utils/custom-errors.util');

// Mock dependencies
const mockOrderRepositoryInstance = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByBookingId: jest.fn(),
  update: jest.fn(),
};

const mockBookingRepositoryInstance = {
  findById: jest.fn(),
};

jest.mock('../../../src/repositories/order.repository', () => {
  return {
    OrderRepository: jest.fn(() => mockOrderRepositoryInstance),
  };
});
jest.mock('../../../src/repositories/booking.repository', () => {
  return {
    BookingRepository: jest.fn(() => mockBookingRepositoryInstance),
  };
});
jest.mock('../../../src/utils/transaction.util');
jest.mock('../../../src/utils/cache.util');
jest.mock('../../../src/utils/id-generator.util');
jest.mock('../../../src/utils/database.connection');

describe('OrderService', () => {
  let orderService;
  let mockOrderRepository;
  let mockBookingRepository;
  let cacheGetSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks first
    TransactionUtil.execute = jest.fn((callback) => callback(null));
    cacheGetSpy = jest.spyOn(CacheUtil, 'get').mockReturnValue(null);
    jest.spyOn(CacheUtil, 'set').mockImplementation(() => {});
    jest.spyOn(CacheUtil, 'delete').mockImplementation(() => {});
    jest.spyOn(CacheUtil, 'invalidatePattern').mockImplementation(() => {});
    jest.spyOn(IdGeneratorUtil, 'generateId').mockReturnValue('order_123');
    
    // Create service after mocks are set up
    orderService = new OrderService();
    
    // Always replace with our mock instances to ensure they're used
    orderService.repository = mockOrderRepositoryInstance;
    orderService.bookingRepository = mockBookingRepositoryInstance;
    
    // Ensure we're using the mock instances
    mockOrderRepository = mockOrderRepositoryInstance;
    mockBookingRepository = mockBookingRepositoryInstance;
  });

  describe('createOrder', () => {
    const validOrderData = {
      userId: 'user_123',
      eventId: 'event_456',
      bookingId: 'booking_789',
      totalAmount: 1000,
      currency: 'NGN',
      paymentMethod: 'card',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '12345678901',
    };

    it('should create an order successfully', async () => {
      const mockBooking = {
        id: validOrderData.bookingId,
        eventId: validOrderData.eventId,
        userId: validOrderData.userId,
      };

      const mockOrder = {
        id: 'order_123',
        ...validOrderData,
        orderNumber: 'ORD-ABC123',
        status: ORDER_STATUS.PENDING,
        paymentStatus: ORDER_STATUS.PENDING,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking);
      mockOrderRepository.findByBookingId.mockResolvedValue(null);
      mockOrderRepository.create.mockResolvedValue(mockOrder);

      // Mock generateOrderNumber
      jest.spyOn(orderService, 'generateOrderNumber').mockReturnValue('ORD-ABC123');

      const result = await orderService.createOrder(validOrderData);

      expect(mockBookingRepository.findById).toHaveBeenCalledWith(
        validOrderData.bookingId,
        null
      );
      expect(mockOrderRepository.findByBookingId).toHaveBeenCalledWith(
        validOrderData.bookingId
      );
      expect(mockOrderRepository.create).toHaveBeenCalled();
      expect(CacheUtil.delete).toHaveBeenCalledWith('order:order_123');
      expect(CacheUtil.invalidatePattern).toHaveBeenCalledWith('orders:*');
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundError when booking does not exist', async () => {
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(orderService.createOrder(validOrderData)).rejects.toThrow(
        NotFoundError
      );
      await expect(orderService.createOrder(validOrderData)).rejects.toThrow(
        `Booking with id ${validOrderData.bookingId} not found`
      );

      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when order already exists for booking', async () => {
      const mockBooking = {
        id: validOrderData.bookingId,
      };
      const existingOrder = {
        id: 'order_existing',
        bookingId: validOrderData.bookingId,
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking);
      mockOrderRepository.findByBookingId.mockResolvedValue(existingOrder);

      await expect(orderService.createOrder(validOrderData)).rejects.toThrow(
        ConflictError
      );
      await expect(orderService.createOrder(validOrderData)).rejects.toThrow(
        'Order already exists for this booking'
      );

      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it('should use default currency when not provided', async () => {
      const mockBooking = {
        id: validOrderData.bookingId,
      };
      const orderDataWithoutCurrency = {
        ...validOrderData,
        currency: undefined,
      };
      const mockOrder = {
        id: 'order_123',
        currency: 'NGN',
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking);
      mockOrderRepository.findByBookingId.mockResolvedValue(null);
      mockOrderRepository.create.mockResolvedValue(mockOrder);
      jest.spyOn(orderService, 'generateOrderNumber').mockReturnValue('ORD-ABC123');

      await orderService.createOrder(orderDataWithoutCurrency);

      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'NGN',
        }),
        null
      );
    });

    it('should throw DatabaseError on repository error', async () => {
      mockBookingRepository.findById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(orderService.createOrder(validOrderData)).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('getOrderById', () => {
    const orderId = 'order_123';

    it('should return cached order when available', async () => {
      const cachedOrder = {
        id: orderId,
        userId: 'user_123',
        totalAmount: 1000,
      };

      cacheGetSpy.mockReturnValue(cachedOrder);

      const result = await orderService.getOrderById(orderId);

      expect(CacheUtil.get).toHaveBeenCalledWith(`order:${orderId}`);
      expect(mockOrderRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(cachedOrder);
    });

    it('should fetch from repository and cache when not cached', async () => {
      const mockOrder = {
        id: orderId,
        userId: 'user_123',
        totalAmount: 1000,
        status: ORDER_STATUS.PENDING,
      };

      cacheGetSpy.mockReturnValue(null);
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById(orderId);

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(CacheUtil.set).toHaveBeenCalledWith(
        `order:${orderId}`,
        mockOrder,
        5 * 60 * 1000
      );
      expect(result).toEqual(mockOrder);
    });

    it('should return null when order not found', async () => {
      cacheGetSpy.mockReturnValue(null);
      mockOrderRepository.findById.mockResolvedValue(null);

      const result = await orderService.getOrderById(orderId);

      expect(result).toBeNull();
      expect(CacheUtil.set).not.toHaveBeenCalled();
    });
  });

  describe('getOrdersByUserId', () => {
    const userId = 'user_123';

    it('should return orders for user', async () => {
      const mockOrders = [
        { id: 'order_1', userId },
        { id: 'order_2', userId },
      ];

      mockOrderRepository.findByUserId.mockResolvedValue({
        orders: mockOrders,
        total: 2,
      });

      const result = await orderService.getOrdersByUserId(userId);

      expect(mockOrderRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockOrders);
    });

    it('should return empty array when no orders found', async () => {
      mockOrderRepository.findByUserId.mockResolvedValue({
        orders: [],
        total: 0,
      });

      const result = await orderService.getOrdersByUserId(userId);

      expect(result).toEqual([]);
    });

    it('should throw DatabaseError on repository error', async () => {
      mockOrderRepository.findByUserId.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(orderService.getOrdersByUserId(userId)).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('updateOrder', () => {
    const orderId = 'order_123';
    const updateData = {
      status: ORDER_STATUS.PAID,
      paymentStatus: ORDER_STATUS.PAID,
      paymentTransactionId: 'txn_123',
    };

    it('should update order successfully', async () => {
      const existingOrder = {
        id: orderId,
        userId: 'user_123',
        status: ORDER_STATUS.PENDING,
        paymentStatus: ORDER_STATUS.PENDING,
        getVersion: jest.fn().mockReturnValue(0),
        markAsPaid: jest.fn(),
      };

      const updatedOrder = {
        ...existingOrder,
        ...updateData,
        updatedAt: new Date(),
      };

      mockOrderRepository.findById.mockResolvedValue(existingOrder);
      mockOrderRepository.update.mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrder(orderId, updateData);

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId, null);
      expect(existingOrder.status).toBe(ORDER_STATUS.PAID);
      expect(existingOrder.paymentStatus).toBe(ORDER_STATUS.PAID);
      expect(existingOrder.markAsPaid).toHaveBeenCalledWith(
        updateData.paymentTransactionId
      );
      expect(mockOrderRepository.update).toHaveBeenCalled();
      expect(CacheUtil.delete).toHaveBeenCalledWith(`order:${orderId}`);
      expect(result).toEqual(updatedOrder);
    });

    it('should throw NotFoundError when order does not exist', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(orderService.updateOrder(orderId, updateData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should call markAsCancelled when status is CANCELLED', async () => {
      const existingOrder = {
        id: orderId,
        status: ORDER_STATUS.PENDING,
        markAsCancelled: jest.fn(),
        getVersion: jest.fn().mockReturnValue(0),
      };

      mockOrderRepository.findById.mockResolvedValue(existingOrder);
      mockOrderRepository.update.mockResolvedValue(existingOrder);

      await orderService.updateOrder(orderId, {
        status: ORDER_STATUS.CANCELLED,
      });

      expect(existingOrder.markAsCancelled).toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const existingOrder = {
        id: orderId,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        getVersion: jest.fn().mockReturnValue(0),
      };

      mockOrderRepository.findById.mockResolvedValue(existingOrder);
      mockOrderRepository.update.mockResolvedValue(existingOrder);

      await orderService.updateOrder(orderId, {
        customerName: 'Jane Doe',
      });

      expect(existingOrder.customerName).toBe('Jane Doe');
      expect(existingOrder.customerEmail).toBe('john@example.com');
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate a unique order number', () => {
      const orderNumber = orderService.generateOrderNumber();

      expect(orderNumber).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(orderNumber.startsWith('ORD-')).toBe(true);
    });

    it('should generate different order numbers on multiple calls', () => {
      const orderNumber1 = orderService.generateOrderNumber();
      // Small delay to ensure timestamp difference
      const orderNumber2 = orderService.generateOrderNumber();

      expect(orderNumber1).not.toBe(orderNumber2);
    });
  });
});


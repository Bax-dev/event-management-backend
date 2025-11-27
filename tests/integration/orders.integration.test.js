const request = require('supertest');
const { createTestApp } = require('./helpers/test-app');
const { TestHelpers } = require('./helpers/test-helpers');
const { BookingService } = require('../../src/services/booking.service');
const { OrderService } = require('../../src/services/order.service');

describe('Orders API Integration Tests', () => {
  let app;
  let bookingService;
  let orderService;
  let testUser;
  let testEvent;
  let testBooking;
  let authToken;

  beforeAll(() => {
    app = createTestApp();
    bookingService = new BookingService();
    orderService = new OrderService();
  });

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser();
    testEvent = await TestHelpers.createTestEvent({ totalTickets: 100 });
    authToken = testUser.token;

    // Create a booking for order creation
    const bookingData = {
      eventId: testEvent.id,
      userId: testUser.user.id,
      numberOfTickets: 2,
    };

    testBooking = await bookingService.createBooking(bookingData);
  });

  afterEach(async () => {
    await TestHelpers.cleanup();
  });

  describe('POST /api/orders', () => {
    it('should create an order successfully', async () => {
      const orderData = {
        userId: testUser.user.id,
        eventId: testEvent.id,
        bookingId: testBooking.id,
        totalAmount: 2000,
        currency: 'NGN',
        paymentMethod: 'card',
        customerName: 'Test Customer',
        customerEmail: testUser.email,
        customerPhone: '12345678901',
      };

      const response = await request(app)
        .post('/api/orders')
        .set(TestHelpers.authHeader(authToken))
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.bookingId).toBe(orderData.bookingId);
      expect(response.body.data.totalAmount).toBe(orderData.totalAmount);
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should use default currency NGN when not provided', async () => {
      const orderData = {
        userId: testUser.user.id,
        eventId: testEvent.id,
        bookingId: testBooking.id,
        totalAmount: 2000,
        paymentMethod: 'card',
        customerName: 'Test Customer',
        customerEmail: testUser.email,
      };

      const response = await request(app)
        .post('/api/orders')
        .set(TestHelpers.authHeader(authToken))
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currency).toBe('NGN');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set(TestHelpers.authHeader(authToken))
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('User ID is required');
      expect(response.body.errors).toContain('Event ID is required');
      expect(response.body.errors).toContain('Booking ID is required');
      expect(response.body.errors).toContain('Total amount must be greater than 0');
    });

    it('should return 400 for invalid totalAmount', async () => {
      const orderData = {
        userId: testUser.user.id,
        eventId: testEvent.id,
        bookingId: testBooking.id,
        totalAmount: -100,
      };

      const response = await request(app)
        .post('/api/orders')
        .set(TestHelpers.authHeader(authToken))
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Total amount must be greater than 0');
    });

    it('should return 400 for invalid currency format', async () => {
      const orderData = {
        userId: testUser.user.id,
        eventId: testEvent.id,
        bookingId: testBooking.id,
        totalAmount: 2000,
        currency: 'NG', // Invalid - not 3 letters
      };

      const response = await request(app)
        .post('/api/orders')
        .set(TestHelpers.authHeader(authToken))
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        'Currency must be a 3-letter code (e.g., NGN, USD)'
      );
    });

    it('should return 404 for non-existent booking', async () => {
      const orderData = {
        userId: testUser.user.id,
        eventId: testEvent.id,
        bookingId: '00000000-0000-0000-0000-000000000000',
        totalAmount: 2000,
      };

      const response = await request(app)
        .post('/api/orders')
        .set(TestHelpers.authHeader(authToken))
        .send(orderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Booking');
    });

    it('should return 409 when order already exists for booking', async () => {
      const orderData = {
        userId: testUser.user.id,
        eventId: testEvent.id,
        bookingId: testBooking.id,
        totalAmount: 2000,
      };

      // Create first order
      await request(app)
        .post('/api/orders')
        .set(TestHelpers.authHeader(authToken))
        .send(orderData)
        .expect(201);

      // Try to create another order for same booking
      const response = await request(app)
        .post('/api/orders')
        .set(TestHelpers.authHeader(authToken))
        .send(orderData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order already exists for this booking');
    });
  });

  describe('GET /api/orders/user/:userId', () => {
    beforeEach(async () => {
      // Create some orders for the user
      const order1 = await orderService.createOrder({
        userId: testUser.user.id,
        eventId: testEvent.id,
        bookingId: testBooking.id,
        totalAmount: 2000,
      });

      // Create another booking and order
      const booking2 = await bookingService.createBooking({
        eventId: testEvent.id,
        userId: testUser.user.id,
        numberOfTickets: 1,
      });

      const order2 = await orderService.createOrder({
        userId: testUser.user.id,
        eventId: testEvent.id,
        bookingId: booking2.id,
        totalAmount: 1000,
      });
    });

    it('should return orders for a user', async () => {
      const response = await request(app)
        .get(`/api/orders/user/${testUser.user.id}`)
        .set(TestHelpers.authHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('userId');
      expect(response.body.data[0].userId).toBe(testUser.user.id);
    });

    it('should return empty array for user with no orders', async () => {
      const newUser = await TestHelpers.createTestUser();

      const response = await request(app)
        .get(`/api/orders/user/${newUser.user.id}`)
        .set(TestHelpers.authHeader(newUser.token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });
});


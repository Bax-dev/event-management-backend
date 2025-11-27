const request = require('supertest');
const { createTestApp } = require('./helpers/test-app');
const { TestHelpers } = require('./helpers/test-helpers');
const { BookingService } = require('../../src/services/booking.service');

describe('Bookings API Integration Tests', () => {
  let app;
  let bookingService;
  let testUser;
  let testEvent;
  let authToken;

  beforeAll(() => {
    app = createTestApp();
    bookingService = new BookingService();
  });

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser();
    testEvent = await TestHelpers.createTestEvent({ totalTickets: 100 });
    authToken = testUser.token;
  });

  afterEach(async () => {
    await TestHelpers.cleanup();
  });

  describe('POST /api/bookings', () => {
    it('should create a booking successfully', async () => {
      const bookingData = {
        eventId: testEvent.id,
        userId: testUser.user.id,
        numberOfTickets: 2,
      };

      const response = await request(app)
        .post('/api/bookings')
        .set(TestHelpers.authHeader(authToken))
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.eventId).toBe(bookingData.eventId);
      expect(response.body.data.userId).toBe(bookingData.userId);
      expect(response.body.data.numberOfTickets).toBe(bookingData.numberOfTickets);
    });

    it('should return 400 for missing eventId', async () => {
      const bookingData = {
        userId: testUser.user.id,
        numberOfTickets: 2,
      };

      const response = await request(app)
        .post('/api/bookings')
        .set(TestHelpers.authHeader(authToken))
        .send(bookingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Event ID is required');
    });

    it('should return 400 for invalid numberOfTickets', async () => {
      const bookingData = {
        eventId: testEvent.id,
        userId: testUser.user.id,
        numberOfTickets: 0,
      };

      const response = await request(app)
        .post('/api/bookings')
        .set(TestHelpers.authHeader(authToken))
        .send(bookingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        'Number of tickets must be greater than 0'
      );
    });

    it('should return 400 for numberOfTickets exceeding limit', async () => {
      const bookingData = {
        eventId: testEvent.id,
        userId: testUser.user.id,
        numberOfTickets: 101,
      };

      const response = await request(app)
        .post('/api/bookings')
        .set(TestHelpers.authHeader(authToken))
        .send(bookingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        'Cannot book more than 100 tickets at once'
      );
    });

    it('should return 404 for non-existent event', async () => {
      const bookingData = {
        eventId: '00000000-0000-0000-0000-000000000000',
        userId: testUser.user.id,
        numberOfTickets: 2,
      };

      const response = await request(app)
        .post('/api/bookings')
        .set(TestHelpers.authHeader(authToken))
        .send(bookingData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Event');
    });

    it('should return 409 when not enough tickets available', async () => {
      // Book all available tickets first
      const bookingData = {
        eventId: testEvent.id,
        userId: testUser.user.id,
        numberOfTickets: 100,
      };

      await request(app)
        .post('/api/bookings')
        .set(TestHelpers.authHeader(authToken))
        .send(bookingData)
        .expect(201);

      // Try to book more tickets
      const response = await request(app)
        .post('/api/bookings')
        .set(TestHelpers.authHeader(authToken))
        .send({
          ...bookingData,
          numberOfTickets: 1,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not enough tickets available');
    });
  });

  describe('GET /api/bookings/:id', () => {
    let testBooking;

    beforeEach(async () => {
      const bookingData = {
        eventId: testEvent.id,
        userId: testUser.user.id,
        numberOfTickets: 2,
      };

      const booking = await bookingService.createBooking(bookingData);
      testBooking = booking;
    });

    it('should return booking by id', async () => {
      const response = await request(app)
        .get(`/api/bookings/${testBooking.id}`)
        .set(TestHelpers.authHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testBooking.id);
      expect(response.body.data.eventId).toBe(testEvent.id);
    });

    it('should return 404 for non-existent booking', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/bookings/${fakeId}`)
        .set(TestHelpers.authHeader(authToken))
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/bookings/event/:eventId', () => {
    beforeEach(async () => {
      // Create multiple bookings for the event
      const booking1 = await bookingService.createBooking({
        eventId: testEvent.id,
        userId: testUser.user.id,
        numberOfTickets: 2,
      });

      const anotherUser = await TestHelpers.createTestUser();
      const booking2 = await bookingService.createBooking({
        eventId: testEvent.id,
        userId: anotherUser.user.id,
        numberOfTickets: 3,
      });
    });

    it('should return all bookings for an event', async () => {
      const response = await request(app)
        .get(`/api/bookings/event/${testEvent.id}`)
        .set(TestHelpers.authHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('eventId');
      expect(response.body.data[0].eventId).toBe(testEvent.id);
    });

    it('should return empty array for event with no bookings', async () => {
      const newEvent = await TestHelpers.createTestEvent();

      const response = await request(app)
        .get(`/api/bookings/event/${newEvent.id}`)
        .set(TestHelpers.authHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    let testBooking;

    beforeEach(async () => {
      const bookingData = {
        eventId: testEvent.id,
        userId: testUser.user.id,
        numberOfTickets: 2,
      };

      const booking = await bookingService.createBooking(bookingData);
      testBooking = booking;
    });

    it('should cancel booking successfully', async () => {
      const response = await request(app)
        .delete(`/api/bookings/${testBooking.id}`)
        .set(TestHelpers.authHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
      expect(response.body.message).toContain('cancelled successfully');
    });

    it('should return 404 for non-existent booking', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .delete(`/api/bookings/${fakeId}`)
        .set(TestHelpers.authHeader(authToken))
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 when booking is already cancelled', async () => {
      // Cancel the booking first
      await request(app)
        .delete(`/api/bookings/${testBooking.id}`)
        .set(TestHelpers.authHeader(authToken))
        .expect(200);

      // Try to cancel again
      const response = await request(app)
        .delete(`/api/bookings/${testBooking.id}`)
        .set(TestHelpers.authHeader(authToken))
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already cancelled');
    });
  });
});


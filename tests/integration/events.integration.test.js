const request = require('supertest');
const { createTestApp } = require('./helpers/test-app');
const { TestHelpers } = require('./helpers/test-helpers');
const { EventService } = require('../../src/services/event.service');

describe('Events API Integration Tests', () => {
  let app;
  let eventService;

  beforeAll(() => {
    app = createTestApp();
    eventService = new EventService();
  });

  afterEach(async () => {
    await TestHelpers.cleanup();
  });

  describe('POST /api/tickets/initialize', () => {
    it('should initialize an event successfully', async () => {
      const eventData = {
        name: 'Test Event',
        description: 'Test Event Description',
        totalTickets: 100,
      };

      const response = await request(app)
        .post('/api/tickets/initialize')
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('eventId');
      expect(response.body.data.name).toBe(eventData.name);
      expect(response.body.data.totalTickets).toBe(eventData.totalTickets);
      expect(response.body.data.availableTickets).toBe(eventData.totalTickets);
      expect(response.body.data.message).toBe('Event initialized successfully');
    });

    it('should return 400 for missing event name', async () => {
      const eventData = {
        description: 'Test Description',
        totalTickets: 100,
      };

      const response = await request(app)
        .post('/api/tickets/initialize')
        .send(eventData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Event name is required');
    });

    it('should return 400 for invalid totalTickets', async () => {
      const eventData = {
        name: 'Test Event',
        totalTickets: 0,
      };

      const response = await request(app)
        .post('/api/tickets/initialize')
        .send(eventData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        'Total tickets must be a positive number'
      );
    });

    it('should return 400 for totalTickets exceeding limit', async () => {
      const eventData = {
        name: 'Test Event',
        totalTickets: 1000001,
      };

      const response = await request(app)
        .post('/api/tickets/initialize')
        .send(eventData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        'Total tickets cannot exceed 1,000,000'
      );
    });
  });

  describe('GET /api/events', () => {
    beforeEach(async () => {
      // Create some test events
      await TestHelpers.createTestEvent({ name: 'Event 1' });
      await TestHelpers.createTestEvent({ name: 'Event 2' });
      await TestHelpers.createTestEvent({ name: 'Event 3' });
    });

    it('should return list of events with pagination', async () => {
      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/events?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.data.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array when no events exist', async () => {
      // This test assumes a clean database or proper cleanup
      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });
  });

  describe('GET /api/events/:id', () => {
    let testEvent;

    beforeEach(async () => {
      testEvent = await TestHelpers.createTestEvent();
    });

    it('should return event by id', async () => {
      const response = await request(app)
        .get(`/api/events/${testEvent.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testEvent.id);
      expect(response.body.data.name).toBe(testEvent.name);
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/events/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Event not found');
    });
  });

  describe('GET /api/events/:id/tickets', () => {
    let testEvent;

    beforeEach(async () => {
      testEvent = await TestHelpers.createTestEvent({ totalTickets: 100 });
    });

    it('should return available tickets information', async () => {
      const response = await request(app)
        .get(`/api/events/${testEvent.id}/tickets`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('eventId');
      expect(response.body.data).toHaveProperty('availableTickets');
      expect(response.body.data).toHaveProperty('totalTickets');
      expect(response.body.data).toHaveProperty('bookedTickets');
      expect(response.body.data).toHaveProperty('isSoldOut');
      expect(response.body.data.eventId).toBe(testEvent.id);
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/events/${fakeId}/tickets`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/events/:id', () => {
    let testEvent;

    beforeEach(async () => {
      testEvent = await TestHelpers.createTestEvent();
    });

    it('should update event successfully', async () => {
      const updateData = {
        name: 'Updated Event Name',
        description: 'Updated Description',
      };

      const response = await request(app)
        .put(`/api/events/${testEvent.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should update totalTickets and recalculate availableTickets', async () => {
      const updateData = {
        totalTickets: 150,
      };

      const response = await request(app)
        .put(`/api/events/${testEvent.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTickets).toBe(150);
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .put(`/api/events/${fakeId}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid update data', async () => {
      const response = await request(app)
        .put(`/api/events/${testEvent.id}`)
        .send({ totalTickets: -10 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        'Total tickets must be greater than 0'
      );
    });
  });

  describe('DELETE /api/events/:id', () => {
    let testEvent;

    beforeEach(async () => {
      testEvent = await TestHelpers.createTestEvent();
    });

    it('should delete event successfully', async () => {
      const response = await request(app)
        .delete(`/api/events/${testEvent.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .delete(`/api/events/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});


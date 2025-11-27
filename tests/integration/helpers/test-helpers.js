const { UserService } = require('../../../src/services/user.service');
const { EventService } = require('../../../src/services/event.service');
const { JwtUtil } = require('../../../src/utils/jwt.util');

/**
 * Test helper utilities for integration tests
 */
class TestHelpers {
  /**
   * Creates a test user and returns user data with token
   */
  static async createTestUser(userData = {}) {
    const defaultUser = {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User',
      phone: '12345678901',
      ...userData,
    };

    const userService = new UserService();
    const user = await userService.register(defaultUser);

    const token = JwtUtil.generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user,
      token,
      email: defaultUser.email,
      password: defaultUser.password,
    };
  }

  /**
   * Creates a test event and returns event data
   */
  static async createTestEvent(eventData = {}) {
    const defaultEvent = {
      name: `Test Event ${Date.now()}`,
      description: 'Test Event Description',
      totalTickets: 100,
      ...eventData,
    };

    const eventService = new EventService();
    const event = await eventService.createEvent(defaultEvent);

    return event;
  }

  /**
   * Generates a JWT token for a user
   */
  static generateToken(userId, email) {
    return JwtUtil.generateToken({
      userId,
      email,
    });
  }

  /**
   * Creates authorization header with Bearer token
   */
  static authHeader(token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Waits for a specified number of milliseconds
   */
  static async wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleans up test data (can be extended to delete test records)
   */
  static async cleanup() {
    // Placeholder for cleanup logic
    // In a real scenario, you might want to delete test data from the database
  }
}

module.exports = { TestHelpers };


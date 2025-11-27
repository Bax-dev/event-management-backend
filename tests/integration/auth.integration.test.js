const request = require('supertest');
const { createTestApp } = require('./helpers/test-app');
const { TestHelpers } = require('./helpers/test-helpers');
const { UserService } = require('../../src/services/user.service');

describe('Auth API Integration Tests', () => {
  let app;
  let userService;

  beforeAll(() => {
    app = createTestApp();
    userService = new UserService();
  });

  afterEach(async () => {
    await TestHelpers.cleanup();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
        phone: '12345678901',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.data.message).toBe('User registered successfully');
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Invalid email format');
    });

    it('should return 400 for password too short', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'short',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        'Password must be at least 8 characters long'
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Email is required');
      expect(response.body.errors).toContain('Password is required');
    });

    it('should return 400 for invalid phone number format', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        phone: '123', // Invalid - not 11 digits
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Invalid phone number format');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!',
      };

      // Register first user
      await request(app).post('/api/auth/register').send(userData).expect(201);

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await TestHelpers.createTestUser();
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.message).toBe('Login successful');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Email is required');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Password is required');
    });
  });

  describe('GET /api/auth/profile', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await TestHelpers.createTestUser();
      authToken = testUser.token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set(TestHelpers.authHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set({ Authorization: 'Bearer invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should return 401 with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set({ Authorization: 'InvalidFormat token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
  });
});


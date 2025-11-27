// Integration test setup
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Set JWT secret for testing
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Set default database config if not provided
if (!process.env.DB_HOST) {
  process.env.DB_HOST = 'localhost';
}
if (!process.env.DB_PORT) {
  process.env.DB_PORT = '5432';
}
if (!process.env.DB_NAME) {
  process.env.DB_NAME = 'event_management_test';
}
if (!process.env.DB_USER) {
  process.env.DB_USER = 'postgres';
}
if (!process.env.DB_PASSWORD) {
  process.env.DB_PASSWORD = '';
}

// Global test timeout (increased for database operations)
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise (but keep error for debugging)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging database connection issues
  // error: jest.fn(),
};


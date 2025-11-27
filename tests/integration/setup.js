const dotenv = require('dotenv');

dotenv.config({ path: '.env.test' });

process.env.NODE_ENV = 'test';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

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
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
}

const { db } = require('../../src/utils/database.connection');
const { MigrationRunner } = require('../../migrate');

jest.setTimeout(30000);

beforeAll(async () => {
  try {
    await db.ensureDatabase();
    db.connect();
    const runner = new MigrationRunner();
    await runner.runMigrations();
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await db.close();
  } catch (error) {
    console.error('Failed to close database connection:', error);
  }
});

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

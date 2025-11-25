/**
 * Migration: Create users table
 * This migration creates the users table for user authentication and management
 */

exports.up = async (pgm) => {
  await pgm.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(200),
      phone VARCHAR(50),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    )
  `);

  await pgm.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)');
};

exports.down = async (pgm) => {
  await pgm.query('DROP INDEX IF EXISTS idx_users_created_at');
  await pgm.query('DROP INDEX IF EXISTS idx_users_is_active');
  await pgm.query('DROP INDEX IF EXISTS idx_users_email');
  await pgm.query('DROP TABLE IF EXISTS users');
};

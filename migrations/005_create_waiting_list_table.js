/**
 * Migration: Create waiting_list table
 * This migration creates the waiting_list table for managing waiting lists
 */

exports.up = async (pgm) => {
  await pgm.query(`
    CREATE TABLE IF NOT EXISTS waiting_list (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL,
      number_of_tickets INTEGER NOT NULL CHECK (number_of_tickets > 0),
      priority INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'fulfilled', 'cancelled')),
      notified_at TIMESTAMP,
      fulfilled_at TIMESTAMP,
      version INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgm.query('CREATE INDEX IF NOT EXISTS idx_waiting_list_event_id ON waiting_list(event_id)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_waiting_list_user_id ON waiting_list(user_id)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON waiting_list(status)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_waiting_list_priority ON waiting_list(priority DESC, created_at ASC)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_waiting_list_created_at ON waiting_list(created_at)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_waiting_list_version ON waiting_list(version)');
};

exports.down = async (pgm) => {
  await pgm.query('DROP INDEX IF EXISTS idx_waiting_list_version');
  await pgm.query('DROP INDEX IF EXISTS idx_waiting_list_created_at');
  await pgm.query('DROP INDEX IF EXISTS idx_waiting_list_priority');
  await pgm.query('DROP INDEX IF EXISTS idx_waiting_list_status');
  await pgm.query('DROP INDEX IF EXISTS idx_waiting_list_user_id');
  await pgm.query('DROP INDEX IF EXISTS idx_waiting_list_event_id');
  await pgm.query('DROP TABLE IF EXISTS waiting_list');
};

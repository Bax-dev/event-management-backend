

exports.up = async (pgm) => {
  await pgm.query(`
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(200) NOT NULL,
      description TEXT,
      total_tickets INTEGER NOT NULL CHECK (total_tickets > 0),
      available_tickets INTEGER NOT NULL CHECK (available_tickets >= 0),
      booked_tickets INTEGER NOT NULL DEFAULT 0 CHECK (booked_tickets >= 0),
      version INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgm.query('CREATE INDEX IF NOT EXISTS idx_events_name ON events(name)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_events_version ON events(version)');
};

exports.down = async (pgm) => {
  await pgm.query('DROP INDEX IF EXISTS idx_events_version');
  await pgm.query('DROP INDEX IF EXISTS idx_events_created_at');
  await pgm.query('DROP INDEX IF EXISTS idx_events_name');
  await pgm.query('DROP TABLE IF EXISTS events');
};

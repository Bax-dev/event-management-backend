

exports.up = async (pgm) => {
  await pgm.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL,
      number_of_tickets INTEGER NOT NULL CHECK (number_of_tickets > 0),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
      version INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgm.query('CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_bookings_version ON bookings(version)');
};

exports.down = async (pgm) => {
  await pgm.query('DROP INDEX IF EXISTS idx_bookings_version');
  await pgm.query('DROP INDEX IF EXISTS idx_bookings_created_at');
  await pgm.query('DROP INDEX IF EXISTS idx_bookings_status');
  await pgm.query('DROP INDEX IF EXISTS idx_bookings_user_id');
  await pgm.query('DROP INDEX IF EXISTS idx_bookings_event_id');
  await pgm.query('DROP TABLE IF EXISTS bookings');
};

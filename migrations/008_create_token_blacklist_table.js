exports.up = async (pgm) => {
  await pgm.query(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      token TEXT NOT NULL UNIQUE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgm.query('CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at)');
};

exports.down = async (pgm) => {
  await pgm.query('DROP INDEX IF EXISTS idx_token_blacklist_expires_at');
  await pgm.query('DROP INDEX IF EXISTS idx_token_blacklist_user_id');
  await pgm.query('DROP INDEX IF EXISTS idx_token_blacklist_token');
  await pgm.query('DROP TABLE IF EXISTS token_blacklist');
};


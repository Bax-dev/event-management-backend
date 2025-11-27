

exports.up = async (pgm) => {
  await pgm.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id VARCHAR(255),
      user_email VARCHAR(255),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id VARCHAR(255),
      description TEXT,
      metadata JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'error')),
      error_message TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pgm.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email)');
};

exports.down = async (pgm) => {
  await pgm.query('DROP INDEX IF EXISTS idx_audit_logs_user_email');
  await pgm.query('DROP INDEX IF EXISTS idx_audit_logs_created_at');
  await pgm.query('DROP INDEX IF EXISTS idx_audit_logs_status');
  await pgm.query('DROP INDEX IF EXISTS idx_audit_logs_entity');
  await pgm.query('DROP INDEX IF EXISTS idx_audit_logs_action');
  await pgm.query('DROP INDEX IF EXISTS idx_audit_logs_user_id');
  await pgm.query('DROP TABLE IF EXISTS audit_logs');
};




exports.up = async (pgm) => {
  await pgm.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
};

exports.down = async (pgm) => {
  await pgm.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
};


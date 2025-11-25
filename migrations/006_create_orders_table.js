/**
 * Migration: Create orders table
 * This migration creates the orders table for order management
 */

exports.up = async (pgm) => {
  await pgm.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id VARCHAR(255) NOT NULL,
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      order_number VARCHAR(50) NOT NULL UNIQUE,
      total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
      currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'refunded')),
      payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
      payment_method VARCHAR(50),
      payment_transaction_id VARCHAR(255),
      customer_name VARCHAR(255),
      customer_email VARCHAR(255),
      customer_phone VARCHAR(50),
      billing_address TEXT,
      notes TEXT,
      version INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      paid_at TIMESTAMP,
      cancelled_at TIMESTAMP
    )
  `);

  await pgm.query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_orders_event_id ON orders(event_id)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_orders_booking_id ON orders(booking_id)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
  await pgm.query('CREATE INDEX IF NOT EXISTS idx_orders_version ON orders(version)');
};

exports.down = async (pgm) => {
  await pgm.query('DROP INDEX IF EXISTS idx_orders_version');
  await pgm.query('DROP INDEX IF EXISTS idx_orders_created_at');
  await pgm.query('DROP INDEX IF EXISTS idx_orders_payment_status');
  await pgm.query('DROP INDEX IF EXISTS idx_orders_status');
  await pgm.query('DROP INDEX IF EXISTS idx_orders_order_number');
  await pgm.query('DROP INDEX IF EXISTS idx_orders_booking_id');
  await pgm.query('DROP INDEX IF EXISTS idx_orders_event_id');
  await pgm.query('DROP INDEX IF EXISTS idx_orders_user_id');
  await pgm.query('DROP TABLE IF EXISTS orders');
};

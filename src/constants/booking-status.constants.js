/**
 * Booking Status Constants
 * Defines all possible statuses for a booking
 */

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUS);

module.exports = {
  BOOKING_STATUS,
  BOOKING_STATUS_VALUES,
};


/**
 * @typedef {Object} BookingEntity
 * @property {string} id
 * @property {string} eventId
 * @property {string} userId
 * @property {number} numberOfTickets
 * @property {'pending'|'confirmed'|'cancelled'} status - See BOOKING_STATUS in constants
 * @property {number} [version]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} CreateBookingRequest
 * @property {string} eventId
 * @property {string} userId
 * @property {number} numberOfTickets
 */

/**
 * @typedef {Object} UpdateBookingRequest
 * @property {'pending'|'confirmed'|'cancelled'} [status] - See BOOKING_STATUS in constants
 */

/**
 * @typedef {Object} BookingResponse
 * @property {string} id
 * @property {string} eventId
 * @property {string} userId
 * @property {number} numberOfTickets
 * @property {'pending'|'confirmed'|'cancelled'} status - See BOOKING_STATUS in constants
 * @property {string} createdAt
 * @property {string} updatedAt
 */

module.exports = {};

/**
 * @typedef {Object} EventEntity
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} totalTickets
 * @property {number} availableTickets
 * @property {number} bookedTickets
 * @property {number} [version]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} CreateEventRequest
 * @property {string} name
 * @property {string} [description]
 * @property {number} totalTickets
 */

/**
 * @typedef {Object} UpdateEventRequest
 * @property {string} [name]
 * @property {string} [description]
 * @property {number} [totalTickets]
 */

/**
 * @typedef {Object} EventResponse
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} totalTickets
 * @property {number} availableTickets
 * @property {number} bookedTickets
 * @property {string} createdAt
 * @property {string} updatedAt
 */

module.exports = {};

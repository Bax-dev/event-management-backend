/**
 * @typedef {Object} WaitingListEntity
 * @property {string} id
 * @property {string} eventId
 * @property {string} userId
 * @property {number} numberOfTickets
 * @property {number} priority
 * @property {'pending'|'notified'|'fulfilled'|'cancelled'} status - See WAITING_LIST_STATUS in constants
 * @property {Date} [notifiedAt]
 * @property {Date} [fulfilledAt]
 * @property {number} [version]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} CreateWaitingListRequest
 * @property {string} eventId
 * @property {string} userId
 * @property {number} numberOfTickets
 */

/**
 * @typedef {Object} UpdateWaitingListRequest
 * @property {'pending'|'notified'|'fulfilled'|'cancelled'} [status]
 * @property {number} [priority]
 */

/**
 * @typedef {Object} WaitingListResponse
 * @property {string} id
 * @property {string} eventId
 * @property {string} userId
 * @property {number} numberOfTickets
 * @property {number} priority
 * @property {'pending'|'notified'|'fulfilled'|'cancelled'} status - See WAITING_LIST_STATUS in constants
 * @property {string} [notifiedAt]
 * @property {string} [fulfilledAt]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

module.exports = {};

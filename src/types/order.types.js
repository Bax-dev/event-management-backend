/**
 * @typedef {Object} OrderEntity
 * @property {string} id
 * @property {string} userId
 * @property {string} eventId
 * @property {string} bookingId
 * @property {string} orderNumber
 * @property {number} totalAmount
 * @property {string} currency
 * @property {'pending'|'confirmed'|'paid'|'cancelled'|'refunded'} status - See ORDER_STATUS in constants
 * @property {'pending'|'processing'|'completed'|'failed'|'refunded'} paymentStatus - See PAYMENT_STATUS in constants
 * @property {string} [paymentMethod]
 * @property {string} [paymentTransactionId]
 * @property {string} [customerName]
 * @property {string} [customerEmail]
 * @property {string} [customerPhone]
 * @property {string} [billingAddress]
 * @property {string} [notes]
 * @property {number} [version]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {Date} [paidAt]
 * @property {Date} [cancelledAt]
 */

/**
 * @typedef {Object} CreateOrderRequest
 * @property {string} userId
 * @property {string} eventId
 * @property {string} bookingId
 * @property {number} totalAmount
 * @property {string} [currency]
 * @property {string} [paymentMethod]
 * @property {string} [customerName]
 * @property {string} [customerEmail]
 * @property {string} [customerPhone]
 * @property {string} [billingAddress]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} UpdateOrderRequest
 * @property {'pending'|'confirmed'|'paid'|'cancelled'|'refunded'} [status]
 * @property {'pending'|'processing'|'completed'|'failed'|'refunded'} [paymentStatus]
 * @property {string} [paymentMethod]
 * @property {string} [paymentTransactionId]
 * @property {string} [customerName]
 * @property {string} [customerEmail]
 * @property {string} [customerPhone]
 * @property {string} [billingAddress]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} OrderResponse
 * @property {string} id
 * @property {string} userId
 * @property {string} eventId
 * @property {string} bookingId
 * @property {string} orderNumber
 * @property {number} totalAmount
 * @property {string} currency
 * @property {'pending'|'confirmed'|'paid'|'cancelled'|'refunded'} status - See ORDER_STATUS in constants
 * @property {'pending'|'processing'|'completed'|'failed'|'refunded'} paymentStatus - See PAYMENT_STATUS in constants
 * @property {string} [paymentMethod]
 * @property {string} [paymentTransactionId]
 * @property {string} [customerName]
 * @property {string} [customerEmail]
 * @property {string} [customerPhone]
 * @property {string} [billingAddress]
 * @property {string} [notes]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} [paidAt]
 * @property {string} [cancelledAt]
 */

module.exports = {};

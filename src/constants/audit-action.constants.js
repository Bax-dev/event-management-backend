/**
 * Audit Action Constants
 * Defines all possible action types for audit logging
 */

const AUDIT_ACTION = {
  // User actions
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',

  // Event actions
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  EVENT_DELETED: 'event.deleted',
  EVENT_INITIALIZED: 'event.initialized',

  // Booking actions
  BOOKING_CREATED: 'booking.created',
  BOOKING_UPDATED: 'booking.updated',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_CONFIRMED: 'booking.confirmed',

  // Order actions
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_PAID: 'order.paid',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_REFUNDED: 'order.refunded',

  // Waiting list actions
  WAITING_LIST_ADDED: 'waiting_list.added',
  WAITING_LIST_NOTIFIED: 'waiting_list.notified',
  WAITING_LIST_FULFILLED: 'waiting_list.fulfilled',
  WAITING_LIST_CANCELLED: 'waiting_list.cancelled',

  // System actions
  SYSTEM_ERROR: 'system.error',
  SYSTEM_WARNING: 'system.warning',
};

const AUDIT_ACTION_VALUES = Object.values(AUDIT_ACTION);

module.exports = {
  AUDIT_ACTION,
  AUDIT_ACTION_VALUES,
};


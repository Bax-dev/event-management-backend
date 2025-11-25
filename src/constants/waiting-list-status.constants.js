/**
 * Waiting List Status Constants
 * Defines all possible statuses for a waiting list entry
 */

const WAITING_LIST_STATUS = {
  PENDING: 'pending',
  NOTIFIED: 'notified',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
};

const WAITING_LIST_STATUS_VALUES = Object.values(WAITING_LIST_STATUS);

module.exports = {
  WAITING_LIST_STATUS,
  WAITING_LIST_STATUS_VALUES,
};


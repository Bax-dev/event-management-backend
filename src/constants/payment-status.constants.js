
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);

module.exports = {
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
};


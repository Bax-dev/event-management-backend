
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
};


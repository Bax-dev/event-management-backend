const { ORDER_STATUS, PAYMENT_STATUS } = require('../../constants');

class Order {
  constructor(data) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.eventId = data.eventId || '';
    this.bookingId = data.bookingId || '';
    this.orderNumber = data.orderNumber || '';
    this.totalAmount = data.totalAmount || 0;
    this.currency = data.currency || 'NGN';
    this.status = data.status || ORDER_STATUS.PENDING;
    this.paymentStatus = data.paymentStatus || PAYMENT_STATUS.PENDING;
    this.paymentMethod = data.paymentMethod;
    this.paymentTransactionId = data.paymentTransactionId;
    this.customerName = data.customerName;
    this.customerEmail = data.customerEmail;
    this.customerPhone = data.customerPhone;
    this.billingAddress = data.billingAddress;
    this.notes = data.notes;
    this.version = data.version ?? 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.paidAt = data.paidAt;
    this.cancelledAt = data.cancelledAt;
  }

  getVersion() {
    return this.version ?? 0;
  }

  setVersion(version) {
    this.version = version;
  }

  markAsPaid(transactionId) {
    this.status = ORDER_STATUS.PAID;
    this.paymentStatus = PAYMENT_STATUS.COMPLETED;
    this.paidAt = new Date();
    this.updatedAt = new Date();
    if (transactionId) {
      this.paymentTransactionId = transactionId;
    }
  }

  markAsCancelled() {
    this.status = ORDER_STATUS.CANCELLED;
    this.paymentStatus = this.paymentStatus === PAYMENT_STATUS.COMPLETED ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.FAILED;
    this.cancelledAt = new Date();
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      eventId: this.eventId,
      bookingId: this.bookingId,
      orderNumber: this.orderNumber,
      totalAmount: this.totalAmount,
      currency: this.currency,
      status: this.status,
      paymentStatus: this.paymentStatus,
      paymentMethod: this.paymentMethod,
      paymentTransactionId: this.paymentTransactionId,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerPhone: this.customerPhone,
      billingAddress: this.billingAddress,
      notes: this.notes,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      paidAt: this.paidAt,
      cancelledAt: this.cancelledAt,
    };
  }
}

module.exports = { Order };

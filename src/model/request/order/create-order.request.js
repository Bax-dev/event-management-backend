class CreateOrderRequestModel {
  constructor(data) {
    this.userId = data.userId;
    this.eventId = data.eventId;
    this.bookingId = data.bookingId;
    this.totalAmount = data.totalAmount;
    this.currency = data.currency || 'NGN';
    this.paymentMethod = data.paymentMethod;
    this.customerName = data.customerName;
    this.customerEmail = data.customerEmail;
    this.customerPhone = data.customerPhone;
    this.billingAddress = data.billingAddress;
    this.notes = data.notes;
  }

  validate() {
    const errors = [];

    if (!this.userId || this.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (!this.eventId || this.eventId.trim().length === 0) {
      errors.push('Event ID is required');
    }

    if (!this.bookingId || this.bookingId.trim().length === 0) {
      errors.push('Booking ID is required');
    }

    if (!this.totalAmount || this.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    if (this.totalAmount > 1000000) {
      errors.push('Total amount cannot exceed 1,000,000');
    }

    if (this.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.customerEmail)) {
      errors.push('Invalid email format');
    }

    if (this.currency && this.currency.length !== 3) {
      errors.push('Currency must be a 3-letter code (e.g., NGN, USD)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = { CreateOrderRequestModel };

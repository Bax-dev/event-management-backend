class UpdateOrderRequestModel {
  constructor(data) {
    this.status = data.status;
    this.paymentStatus = data.paymentStatus;
    this.paymentMethod = data.paymentMethod;
    this.paymentTransactionId = data.paymentTransactionId;
    this.customerName = data.customerName;
    this.customerEmail = data.customerEmail;
    this.customerPhone = data.customerPhone;
    this.billingAddress = data.billingAddress;
    this.notes = data.notes;
  }

  validate() {
    const errors = [];

    if (this.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.customerEmail)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = { UpdateOrderRequestModel };

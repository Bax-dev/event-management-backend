class OrderResponseModel {
  constructor(entity) {
    this.id = entity.id;
    this.userId = entity.userId;
    this.eventId = entity.eventId;
    this.bookingId = entity.bookingId;
    this.orderNumber = entity.orderNumber;
    this.totalAmount = entity.totalAmount;
    this.currency = entity.currency;
    this.status = entity.status;
    this.paymentStatus = entity.paymentStatus;
    this.paymentMethod = entity.paymentMethod;
    this.paymentTransactionId = entity.paymentTransactionId;
    this.customerName = entity.customerName;
    this.customerEmail = entity.customerEmail;
    this.customerPhone = entity.customerPhone;
    this.billingAddress = entity.billingAddress;
    this.notes = entity.notes;
    this.createdAt = entity.createdAt.toISOString();
    this.updatedAt = entity.updatedAt.toISOString();
    this.paidAt = entity.paidAt?.toISOString();
    this.cancelledAt = entity.cancelledAt?.toISOString();
  }

  static fromEntity(entity) {
    return new OrderResponseModel(entity);
  }

  static fromEntities(entities) {
    return entities.map((entity) => OrderResponseModel.fromEntity(entity));
  }
}

module.exports = { OrderResponseModel };

class BookingResponseModel {
  constructor(entity) {
    this.id = entity.id;
    this.eventId = entity.eventId;
    this.userId = entity.userId;
    this.numberOfTickets = entity.numberOfTickets;
    this.status = entity.status;
    this.createdAt = entity.createdAt.toISOString();
    this.updatedAt = entity.updatedAt.toISOString();
  }

  static fromEntity(entity) {
    return new BookingResponseModel(entity);
  }

  static fromEntities(entities) {
    return entities.map((entity) => BookingResponseModel.fromEntity(entity));
  }
}

module.exports = { BookingResponseModel };

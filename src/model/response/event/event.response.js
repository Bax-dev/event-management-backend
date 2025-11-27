class EventResponseModel {
  constructor(entity) {
    this.id = entity.id;
    this.name = entity.name;
    this.description = entity.description;
    this.totalTickets = entity.totalTickets;
    this.availableTickets = entity.availableTickets;
    this.bookedTickets = entity.bookedTickets;
    this.createdAt = entity.createdAt.toISOString();
    this.updatedAt = entity.updatedAt.toISOString();
  }

  static fromEntity(entity) {
    return new EventResponseModel(entity);
  }

  static fromEntities(entities) {
    return entities.map((entity) => EventResponseModel.fromEntity(entity));
  }
}

module.exports = { EventResponseModel };

const { WaitingList } = require('../../entity/waiting-list.entity');

class WaitingListResponseModel {
  constructor(entity) {
    this.id = entity.id;
    this.eventId = entity.eventId;
    this.userId = entity.userId;
    this.numberOfTickets = entity.numberOfTickets;
    this.priority = entity.priority;
    this.status = entity.status;
    this.notifiedAt = entity.notifiedAt?.toISOString();
    this.fulfilledAt = entity.fulfilledAt?.toISOString();
    this.createdAt = entity.createdAt.toISOString();
    this.updatedAt = entity.updatedAt.toISOString();
  }

  static fromEntity(entity) {
    return new WaitingListResponseModel(entity);
  }

  static fromEntities(entities) {
    return entities.map((entity) => WaitingListResponseModel.fromEntity(entity));
  }
}

module.exports = { WaitingListResponseModel };

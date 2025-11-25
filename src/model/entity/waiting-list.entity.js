const { WAITING_LIST_STATUS } = require('../../constants');

class WaitingList {
  constructor(data) {
    this.id = data.id || '';
    this.eventId = data.eventId || '';
    this.userId = data.userId || '';
    this.numberOfTickets = data.numberOfTickets || 0;
    this.priority = data.priority ?? 0;
    this.status = data.status || WAITING_LIST_STATUS.PENDING;
    this.notifiedAt = data.notifiedAt;
    this.fulfilledAt = data.fulfilledAt;
    this.version = data.version ?? 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  getVersion() {
    return this.version ?? 0;
  }

  setVersion(version) {
    this.version = version;
  }

  toJSON() {
    return {
      id: this.id,
      eventId: this.eventId,
      userId: this.userId,
      numberOfTickets: this.numberOfTickets,
      priority: this.priority,
      status: this.status,
      notifiedAt: this.notifiedAt,
      fulfilledAt: this.fulfilledAt,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = { WaitingList };

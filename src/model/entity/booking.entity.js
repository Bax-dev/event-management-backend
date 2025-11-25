const { BOOKING_STATUS } = require('../../constants');

class Booking {
  constructor(data) {
    this.id = data.id || '';
    this.eventId = data.eventId || '';
    this.userId = data.userId || '';
    this.numberOfTickets = data.numberOfTickets || 0;
    this.status = data.status || BOOKING_STATUS.PENDING;
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
      status: this.status,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = { Booking };

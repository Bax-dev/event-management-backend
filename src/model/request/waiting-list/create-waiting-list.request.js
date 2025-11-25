class CreateWaitingListRequestModel {
  constructor(data) {
    this.eventId = data.eventId;
    this.userId = data.userId;
    this.numberOfTickets = data.numberOfTickets;
  }

  validate() {
    const errors = [];

    if (!this.eventId || this.eventId.trim().length === 0) {
      errors.push('Event ID is required');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (!this.numberOfTickets || this.numberOfTickets <= 0) {
      errors.push('Number of tickets must be greater than 0');
    }

    if (!Number.isInteger(this.numberOfTickets)) {
      errors.push('Number of tickets must be an integer');
    }

    if (this.numberOfTickets > 100) {
      errors.push('Cannot request more than 100 tickets on waiting list');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = { CreateWaitingListRequestModel };

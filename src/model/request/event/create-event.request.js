class CreateEventRequestModel {
  constructor(data) {
    this.name = data.name;
    this.description = data.description;
    this.totalTickets = data.totalTickets;
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Event name is required');
    }

    if (this.name && this.name.length > 200) {
      errors.push('Event name must be less than 200 characters');
    }

    if (!this.totalTickets || this.totalTickets <= 0) {
      errors.push('Total tickets must be greater than 0');
    }

    if (!Number.isInteger(this.totalTickets)) {
      errors.push('Total tickets must be an integer');
    }

    if (this.totalTickets > 1000000) {
      errors.push('Total tickets cannot exceed 1,000,000');
    }

    if (this.description && this.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = { CreateEventRequestModel };

class UpdateEventRequestModel {
  constructor(data) {
    this.name = data.name;
    this.description = data.description;
    this.totalTickets = data.totalTickets;
  }

  validate() {
    const errors = [];

    if (this.name !== undefined) {
      if (this.name.trim().length === 0) {
        errors.push('Event name cannot be empty');
      }
      if (this.name.length > 200) {
        errors.push('Event name must be less than 200 characters');
      }
    }

    if (this.totalTickets !== undefined) {
      if (!Number.isInteger(this.totalTickets)) {
        errors.push('Total tickets must be an integer');
      }
    }

    if (this.description !== undefined && this.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = { UpdateEventRequestModel };

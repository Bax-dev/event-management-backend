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
      if (this.totalTickets <= 0) {
        errors.push('Total tickets must be greater than 0');
      }
      if (!Number.isInteger(this.totalTickets)) {
        errors.push('Total tickets must be an integer');
      }
      if (this.totalTickets > 1000000) {
        errors.push('Total tickets cannot exceed 1,000,000');
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

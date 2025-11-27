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
      // Note: totalTickets is added to existing value, so negative values are allowed for reduction
      // Final validation (e.g., not below booked tickets) is done in the service
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

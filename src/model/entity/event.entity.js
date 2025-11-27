class Event {
  constructor(data) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.description = data.description;
    this.totalTickets = data.totalTickets || 0;
    this.availableTickets = data.availableTickets ?? data.totalTickets ?? 0;
    this.bookedTickets = data.bookedTickets || 0;
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
      name: this.name,
      description: this.description,
      totalTickets: this.totalTickets,
      availableTickets: this.availableTickets,
      bookedTickets: this.bookedTickets,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  updateAvailableTickets() {
    this.availableTickets = Math.max(0, this.totalTickets - this.bookedTickets);
  }
}

module.exports = { Event };

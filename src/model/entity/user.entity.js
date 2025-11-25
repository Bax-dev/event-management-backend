class User {
  constructor(data) {
    this.id = data.id || '';
    this.email = data.email || '';
    this.passwordHash = data.passwordHash || '';
    this.name = data.name;
    this.phone = data.phone;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastLogin = data.lastLogin;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      phone: this.phone,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin,
    };
  }
}

module.exports = { User };


class RegisterRequestModel {
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.phone = data.phone;
  }

  validate() {
    const errors = [];

    if (!this.email || this.email.trim().length === 0) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('Invalid email format');
    }

    if (!this.password || this.password.length === 0) {
      errors.push('Password is required');
    } else if (this.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (this.name && this.name.length > 200) {
      errors.push('Name must be less than 200 characters');
    }

    if (this.phone && !/^\+?[1-9]\d{1,14}$/.test(this.phone)) {
      errors.push('Invalid phone number format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = { RegisterRequestModel };


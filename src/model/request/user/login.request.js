class LoginRequestModel {
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
  }

  validate() {
    const errors = [];

    if (!this.email || this.email.trim().length === 0) {
      errors.push('Email is required');
    }

    if (!this.password || this.password.length === 0) {
      errors.push('Password is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = { LoginRequestModel };


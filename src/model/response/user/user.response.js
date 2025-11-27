class UserResponseModel {
  constructor(entity) {
    this.id = entity.id;
    this.email = entity.email;
    this.name = entity.name;
    this.phone = entity.phone;
    this.isActive = entity.isActive;
    this.createdAt = entity.createdAt.toISOString();
    this.updatedAt = entity.updatedAt.toISOString();
    this.lastLogin = entity.lastLogin?.toISOString();
  }

  static fromEntity(entity) {
    return new UserResponseModel(entity);
  }
}

module.exports = { UserResponseModel };


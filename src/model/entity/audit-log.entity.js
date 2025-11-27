const { AUDIT_ACTION } = require('../../constants');

class AuditLog {
  constructor(data) {
    this.id = data.id || '';
    this.userId = data.userId || null;
    this.userEmail = data.userEmail || null;
    this.action = data.action || '';
    this.entityType = data.entityType || null; 
    this.entityId = data.entityId || null;
    this.description = data.description || '';
    this.metadata = data.metadata || null; 
    this.ipAddress = data.ipAddress || null;
    this.userAgent = data.userAgent || null;
    this.status = data.status || AUDIT_ACTION.STATUS_SUCCESS; 
    this.errorMessage = data.errorMessage || null;
    this.createdAt = data.createdAt || new Date();
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      userEmail: this.userEmail,
      action: this.action,
      entityType: this.entityType,
      entityId: this.entityId,
      description: this.description,
      metadata: this.metadata,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      status: this.status,
      errorMessage: this.errorMessage,
      createdAt: this.createdAt,
    };
  }
}

module.exports = { AuditLog };


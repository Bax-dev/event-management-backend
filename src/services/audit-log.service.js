const { AuditLog } = require('../model/entity/audit-log.entity');
const { AuditLogRepository } = require('../repositories/audit-log.repository');
const { IdGeneratorUtil } = require('../utils/id-generator.util');
const { LoggerUtil } = require('../utils/logger.util');
const { DatabaseError } = require('../utils/custom-errors.util');

class AuditLogService {
  constructor() {
    this.repository = new AuditLogRepository();
  }

  async log(data, client) {
    try {
      const auditLog = new AuditLog({
        id: IdGeneratorUtil.generateId(),
        userId: data.userId || null,
        userEmail: data.userEmail || null,
        action: data.action,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        description: data.description || '',
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        status: data.status || 'success',
        errorMessage: data.errorMessage || null,
        createdAt: new Date(),
      });

      const created = await this.repository.create(auditLog, client);

      LoggerUtil.info(`Audit log created: ${data.action}`, {
        userId: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
      });

      return created;
    } catch (error) {
      LoggerUtil.error('Failed to create audit log', error);
      return null;
    }
  }

  async getByUserId(userId, options = {}) {
    try {
      return await this.repository.findByUserId(userId, options);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve audit logs by user', error);
    }
  }

  async getByEntity(entityType, entityId, options = {}) {
    try {
      return await this.repository.findByEntity(entityType, entityId, options);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve audit logs by entity', error);
    }
  }

  async getByAction(action, options = {}) {
    try {
      return await this.repository.findByAction(action, options);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve audit logs by action', error);
    }
  }

  async getAll(options = {}) {
    try {
      return await this.repository.findAll(options);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve audit logs', error);
    }
  }

  async getById(id) {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve audit log', error);
    }
  }
}

module.exports = { AuditLogService };
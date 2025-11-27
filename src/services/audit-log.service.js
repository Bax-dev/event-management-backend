const { AuditLog } = require('../model/entity/audit-log.entity');
const { AuditLogRepository } = require('../repositories/audit-log.repository');
const { IdGeneratorUtil } = require('../utils/id-generator.util');
const { LoggerUtil } = require('../utils/logger.util');
const { DatabaseError } = require('../utils/custom-errors.util');

class AuditLogService {
  constructor() {
    this.repository = new AuditLogRepository();
  }

  /**
   * Create an audit log entry
   * @param {Object} data - Audit log data (action required, other fields optional)
   * @param {Object} [client] - Database client for transactions
   * @returns {Promise<AuditLog>}
   */
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

      // Log to console for debugging (optional)
      LoggerUtil.info(`Audit log created: ${data.action}`, {
        userId: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
      });

      return created;
    } catch (error) {
      // Don't throw error for audit logging failures to avoid breaking main operations
      LoggerUtil.error('Failed to create audit log', error);
      return null;
    }
  }

  /**
   * Get audit logs by user ID
   * @param {string} userId - User ID
   * @param {Object} [options] - Query options (page, limit, sortBy, sortOrder)
   * @returns {Promise<Object>} - Paginated audit logs
   */
  async getByUserId(userId, options = {}) {
    try {
      return await this.repository.findByUserId(userId, options);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve audit logs by user', error);
    }
  }

  /**
   * Get audit logs by entity
   * @param {string} entityType - Entity type (e.g., 'event', 'booking')
   * @param {string} entityId - Entity ID
   * @param {Object} [options] - Query options (page, limit, sortBy, sortOrder)
   * @returns {Promise<Object>} - Paginated audit logs
   */
  async getByEntity(entityType, entityId, options = {}) {
    try {
      return await this.repository.findByEntity(entityType, entityId, options);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve audit logs by entity', error);
    }
  }

  /**
   * Get audit logs by action
   * @param {string} action - Action type
   * @param {Object} [options] - Query options (page, limit, sortBy, sortOrder)
   * @returns {Promise<Object>} - Paginated audit logs
   */
  async getByAction(action, options = {}) {
    try {
      return await this.repository.findByAction(action, options);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve audit logs by action', error);
    }
  }

  /**
   * Get all audit logs
   * @param {Object} [options] - Query options (page, limit, sortBy, sortOrder)
   * @returns {Promise<Object>} - Paginated audit logs
   */
  async getAll(options = {}) {
    try {
      return await this.repository.findAll(options);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve audit logs', error);
    }
  }

  /**
   * Get audit log by ID
   * @param {string} id - Audit log ID
   * @returns {Promise<AuditLog|null>}
   */
  async getById(id) {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve audit log', error);
    }
  }
}

module.exports = { AuditLogService };


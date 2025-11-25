const { AuditLogService } = require('../services/audit-log.service');

/**
 * Audit Log Utility
 * Provides convenient methods for logging operations
 */
class AuditLogUtil {
  constructor() {
    this.service = new AuditLogService();
  }

  /**
   * Extract user information from request
   * @param {Object} req - Express request object
   * @returns {Object} - User info (userId, userEmail)
   */
  static extractUserInfo(req) {
    return {
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
    };
  }

  /**
   * Extract request metadata
   * @param {Object} req - Express request object
   * @returns {Object} - Request metadata (ipAddress, userAgent)
   */
  static extractRequestInfo(req) {
    return {
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.get('user-agent') || null,
    };
  }

  /**
   * Log an action with automatic user and request info extraction
   * @param {Object} req - Express request object
   * @param {string} action - Action type (from AUDIT_ACTION constants)
   * @param {Object} options - Additional options
   * @param {string} [options.entityType] - Entity type
   * @param {string} [options.entityId] - Entity ID
   * @param {string} [options.description] - Description
   * @param {Object} [options.metadata] - Additional metadata
   * @param {string} [options.status] - Status: 'success', 'failure', 'error'
   * @param {string} [options.errorMessage] - Error message
   * @param {Object} [options.client] - Database client for transactions
   * @returns {Promise<AuditLog|null>}
   */
  async logAction(req, action, options = {}) {
    const userInfo = AuditLogUtil.extractUserInfo(req);
    const requestInfo = AuditLogUtil.extractRequestInfo(req);

    return this.service.log(
      {
        ...userInfo,
        ...requestInfo,
        action,
        entityType: options.entityType || null,
        entityId: options.entityId || null,
        description: options.description || '',
        metadata: options.metadata || null,
        status: options.status || 'success',
        errorMessage: options.errorMessage || null,
      },
      options.client
    );
  }

  /**
   * Log a successful action
   * @param {Object} req - Express request object
   * @param {string} action - Action type
   * @param {Object} options - Additional options
   * @returns {Promise<AuditLog|null>}
   */
  async logSuccess(req, action, options = {}) {
    return this.logAction(req, action, {
      ...options,
      status: 'success',
    });
  }

  /**
   * Log a failed action
   * @param {Object} req - Express request object
   * @param {string} action - Action type
   * @param {string} errorMessage - Error message
   * @param {Object} options - Additional options
   * @returns {Promise<AuditLog|null>}
   */
  async logFailure(req, action, errorMessage, options = {}) {
    return this.logAction(req, action, {
      ...options,
      status: 'failure',
      errorMessage,
    });
  }

  /**
   * Log an error
   * @param {Object} req - Express request object
   * @param {string} action - Action type
   * @param {Error|string} error - Error object or message
   * @param {Object} options - Additional options
   * @returns {Promise<AuditLog|null>}
   */
  async logError(req, action, error, options = {}) {
    const errorMessage = error instanceof Error ? error.message : error;
    return this.logAction(req, action, {
      ...options,
      status: 'error',
      errorMessage,
    });
  }
}

// Export singleton instance
const auditLogUtil = new AuditLogUtil();

module.exports = { AuditLogUtil, auditLogUtil };


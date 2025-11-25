const { AuditLogService } = require('../services/audit-log.service');
const { ResponseUtil, ErrorHandlerUtil } = require('../utils');
const { NotFoundError } = require('../utils/custom-errors.util');

class AuditLogController {
  constructor() {
    this.service = new AuditLogService();
  }

  /**
   * Get audit log by ID
   * @route GET /api/audit-logs/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const auditLog = await this.service.getById(id);

      if (!auditLog) {
        throw new NotFoundError('Audit log', id);
      }

      ResponseUtil.success(res, auditLog.toJSON());
    } catch (error) {
      ErrorHandlerUtil.handleError(error, req, res);
    }
  }

  /**
   * Get audit logs by user ID
   * @route GET /api/audit-logs/user/:userId
   */
  async getByUserId(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

      const result = await this.service.getByUserId(userId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      });

      ResponseUtil.success(res, {
        auditLogs: result.data.map((log) => log.toJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      ErrorHandlerUtil.handleError(error, req, res);
    }
  }

  /**
   * Get audit logs by entity
   * @route GET /api/audit-logs/entity/:entityType/:entityId
   */
  async getByEntity(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

      const result = await this.service.getByEntity(entityType, entityId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      });

      ResponseUtil.success(res, {
        auditLogs: result.data.map((log) => log.toJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      ErrorHandlerUtil.handleError(error, req, res);
    }
  }

  /**
   * Get audit logs by action
   * @route GET /api/audit-logs/action/:action
   */
  async getByAction(req, res) {
    try {
      const { action } = req.params;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

      const result = await this.service.getByAction(action, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      });

      ResponseUtil.success(res, {
        auditLogs: result.data.map((log) => log.toJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      ErrorHandlerUtil.handleError(error, req, res);
    }
  }

  /**
   * Get all audit logs
   * @route GET /api/audit-logs
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

      const result = await this.service.getAll({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      });

      ResponseUtil.success(res, {
        auditLogs: result.data.map((log) => log.toJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      ErrorHandlerUtil.handleError(error, req, res);
    }
  }

  /**
   * Get current user's audit logs
   * @route GET /api/audit-logs/me
   */
  async getMyLogs(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

      const result = await this.service.getByUserId(userId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      });

      ResponseUtil.success(res, {
        auditLogs: result.data.map((log) => log.toJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      ErrorHandlerUtil.handleError(error, req, res);
    }
  }
}

module.exports = { AuditLogController };


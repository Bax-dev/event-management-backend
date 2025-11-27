const { AuditLogService } = require('../services/audit-log.service');
const { ResponseUtil, ErrorHandlerUtil } = require('../utils');
const { NotFoundError } = require('../utils/custom-errors.util');

class AuditLogController {
  constructor() {
    this.service = new AuditLogService();
  }

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
        auditLogs: result.data.map(log => log.toJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      ErrorHandlerUtil.handleError(error, req, res);
    }
  }

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
        auditLogs: result.data.map(log => log.toJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      ErrorHandlerUtil.handleError(error, req, res);
    }
  }

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
        auditLogs: result.data.map(log => log.toJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      ErrorHandlerUtil.handleError(error, req, res);
    }
  }

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
        auditLogs: result.data.map(log => log.toJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      ErrorHandlerUtil.handleError(error, req, res);
    }
  }

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
        auditLogs: result.data.map(log => log.toJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      ErrorHandlerUtil.handleError(error, req, res);
    }
  }
}

module.exports = { AuditLogController };

const { db } = require('../utils/database.connection');
const { AuditLog } = require('../model/entity/audit-log.entity');
const { PaginationUtil } = require('../utils/pagination.util');

class AuditLogRepository {
  constructor() {
    this.tableName = 'audit_logs';
  }

  async create(auditLog, client) {
    const query = `
      INSERT INTO ${this.tableName} 
      (id, user_id, user_email, action, entity_type, entity_id, description, metadata, ip_address, user_agent, status, error_message, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = client
      ? await client.query(query, [
          auditLog.id,
          auditLog.userId || null,
          auditLog.userEmail || null,
          auditLog.action,
          auditLog.entityType || null,
          auditLog.entityId || null,
          auditLog.description || null,
          auditLog.metadata ? JSON.stringify(auditLog.metadata) : null,
          auditLog.ipAddress || null,
          auditLog.userAgent || null,
          auditLog.status,
          auditLog.errorMessage || null,
          auditLog.createdAt,
        ])
      : await db.query(query, [
          auditLog.id,
          auditLog.userId || null,
          auditLog.userEmail || null,
          auditLog.action,
          auditLog.entityType || null,
          auditLog.entityId || null,
          auditLog.description || null,
          auditLog.metadata ? JSON.stringify(auditLog.metadata) : null,
          auditLog.ipAddress || null,
          auditLog.userAgent || null,
          auditLog.status,
          auditLog.errorMessage || null,
          auditLog.createdAt,
        ]);

    return this.mapRowToEntity(result.rows[0]);
  }

  async findById(id, client) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;

    const result = client
      ? await client.query(query, [id])
      : await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async findByUserId(userId, options = {}, client) {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1
      ORDER BY ${this.mapFieldToColumn(sortBy)} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} WHERE user_id = $1`;

    const result = client
      ? await client.query(query, [userId, limit, offset])
      : await db.query(query, [userId, limit, offset]);

    const countResult = client
      ? await client.query(countQuery, [userId])
      : await db.query(countQuery, [userId]);

    const total = parseInt(countResult.rows[0].count, 10);

    return {
      data: result.rows.map((row) => this.mapRowToEntity(row)),
      pagination: PaginationUtil.createPagination(page, limit, total),
    };
  }

  async findByEntity(entityType, entityId, options = {}, client) {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM ${this.tableName}
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY ${this.mapFieldToColumn(sortBy)} ${sortOrder}
      LIMIT $3 OFFSET $4
    `;

    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} WHERE entity_type = $1 AND entity_id = $2`;

    const result = client
      ? await client.query(query, [entityType, entityId, limit, offset])
      : await db.query(query, [entityType, entityId, limit, offset]);

    const countResult = client
      ? await client.query(countQuery, [entityType, entityId])
      : await db.query(countQuery, [entityType, entityId]);

    const total = parseInt(countResult.rows[0].count, 10);

    return {
      data: result.rows.map((row) => this.mapRowToEntity(row)),
      pagination: PaginationUtil.createPagination(page, limit, total),
    };
  }

  async findByAction(action, options = {}, client) {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM ${this.tableName}
      WHERE action = $1
      ORDER BY ${this.mapFieldToColumn(sortBy)} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} WHERE action = $1`;

    const result = client
      ? await client.query(query, [action, limit, offset])
      : await db.query(query, [action, limit, offset]);

    const countResult = client
      ? await client.query(countQuery, [action])
      : await db.query(countQuery, [action]);

    const total = parseInt(countResult.rows[0].count, 10);

    return {
      data: result.rows.map((row) => this.mapRowToEntity(row)),
      pagination: PaginationUtil.createPagination(page, limit, total),
    };
  }

  async findAll(options = {}, client) {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM ${this.tableName}
      ORDER BY ${this.mapFieldToColumn(sortBy)} ${sortOrder}
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) FROM ${this.tableName}`;

    const result = client
      ? await client.query(query, [limit, offset])
      : await db.query(query, [limit, offset]);

    const countResult = client
      ? await client.query(countQuery)
      : await db.query(countQuery);

    const total = parseInt(countResult.rows[0].count, 10);

    return {
      data: result.rows.map((row) => this.mapRowToEntity(row)),
      pagination: PaginationUtil.createPagination(page, limit, total),
    };
  }

  mapFieldToColumn(field) {
    const fieldMap = {
      id: 'id',
      userId: 'user_id',
      userEmail: 'user_email',
      action: 'action',
      entityType: 'entity_type',
      entityId: 'entity_id',
      description: 'description',
      metadata: 'metadata',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      status: 'status',
      errorMessage: 'error_message',
      createdAt: 'created_at',
    };

    return fieldMap[field] || field;
  }

  mapColumnToField(column) {
    const columnMap = {
      id: 'id',
      user_id: 'userId',
      user_email: 'userEmail',
      action: 'action',
      entity_type: 'entityType',
      entity_id: 'entityId',
      description: 'description',
      metadata: 'metadata',
      ip_address: 'ipAddress',
      user_agent: 'userAgent',
      status: 'status',
      error_message: 'errorMessage',
      created_at: 'createdAt',
    };

    return columnMap[column] || column;
  }

  mapRowToEntity(row) {
    if (!row) {
      return null;
    }

    return new AuditLog({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      description: row.description,
      metadata: row.metadata ?? null,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    });
  }
}

module.exports = { AuditLogRepository };


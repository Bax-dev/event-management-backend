const { db } = require('../utils/database.connection');
const { Event } = require('../model/entity/event.entity');
const { PaginationUtil } = require('../utils/pagination.util');

class EventRepository {
  constructor() {
    this.tableName = 'events';
    this.columnMap = {
      id: 'id',
      name: 'name',
      description: 'description',
      totalTickets: 'total_tickets',
      availableTickets: 'available_tickets',
      bookedTickets: 'booked_tickets',
      version: 'version',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };
  }

  mapFieldToColumn(field) {
    const column = this.columnMap[field];
    if (!column) {
      return 'created_at';
    }
    return column;
  }

  async create(event, client) {
    const query = `
      INSERT INTO ${this.tableName} 
      (id, name, description, total_tickets, available_tickets, booked_tickets, version, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = client
      ? await client.query(query, [
          event.id,
          event.name,
          event.description || null,
          event.totalTickets,
          event.availableTickets,
          event.bookedTickets,
          0,
          event.createdAt,
          event.updatedAt,
        ])
      : await db.query(query, [
          event.id,
          event.name,
          event.description || null,
          event.totalTickets,
          event.availableTickets,
          event.bookedTickets,
          0,
          event.createdAt,
          event.updatedAt,
        ]);

    return this.mapRowToEntity(result.rows[0]);
  }

  async findById(id, client) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 FOR UPDATE`;
    const result = client
      ? await client.query(query, [id])
      : await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async findByIdWithVersion(id, version) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 AND version = $2`;
    const result = await db.query(query, [id, version]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async findAll(pagination, client) {
    const params = pagination || { page: 1, limit: 10 };
    const offset = PaginationUtil.calculateOffset(params.page || 1, params.limit || 10);

    const sortByField = params.sortBy || 'createdAt';
    const sortBy = this.mapFieldToColumn(sortByField);
    const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    const countResult = client
      ? await client.query(countQuery)
      : await db.query(countQuery);
    const total = parseInt(countResult.rows[0].total, 10);

    const query = `
      SELECT * FROM ${this.tableName} 
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $1 OFFSET $2
    `;

    const result = client
      ? await client.query(query, [params.limit || 10, offset])
      : await db.query(query, [params.limit || 10, offset]);

    return {
      events: result.rows.map((row) => this.mapRowToEntity(row)),
      total,
    };
  }

  async update(event, expectedVersion, client) {
    let query;
    let params;

    if (expectedVersion !== undefined) {
      query = `
        UPDATE ${this.tableName}
        SET name = $2, description = $3, total_tickets = $4, 
            available_tickets = $5, booked_tickets = $6, 
            version = version + 1, updated_at = $7
        WHERE id = $1 AND version = $8
        RETURNING *
      `;
      params = [
        event.id,
        event.name,
        event.description || null,
        event.totalTickets,
        event.availableTickets,
        event.bookedTickets,
        event.updatedAt,
        expectedVersion,
      ];
    } else {
      query = `
        UPDATE ${this.tableName}
        SET name = $2, description = $3, total_tickets = $4, 
            available_tickets = $5, booked_tickets = $6, 
            version = version + 1, updated_at = $7
        WHERE id = $1
        RETURNING *
      `;
      params = [
        event.id,
        event.name,
        event.description || null,
        event.totalTickets,
        event.availableTickets,
        event.bookedTickets,
        event.updatedAt,
      ];
    }

    const result = client
      ? await client.query(query, params)
      : await db.query(query, params);

    if (result.rows.length === 0 && expectedVersion !== undefined) {
      throw new Error('ConcurrencyError');
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async delete(id, client) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = client
      ? await client.query(query, [id])
      : await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  mapRowToEntity(row) {
    return new Event({
      id: row.id,
      name: row.name,
      description: row.description,
      totalTickets: row.total_tickets,
      availableTickets: row.available_tickets,
      bookedTickets: row.booked_tickets,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = { EventRepository };

const { db } = require('../utils/database.connection');
const { Booking } = require('../model/entity/booking.entity');
const { PaginationUtil } = require('../utils/pagination.util');
const { BOOKING_STATUS } = require('../constants');

class BookingRepository {
  constructor() {
    this.tableName = 'bookings';
  }

  async create(booking, client) {
    const query = `
      INSERT INTO ${this.tableName} 
      (id, event_id, user_id, number_of_tickets, status, version, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = client
      ? await client.query(query, [
          booking.id,
          booking.eventId,
          booking.userId,
          booking.numberOfTickets,
          booking.status,
          0,
          booking.createdAt,
          booking.updatedAt,
        ])
      : await db.query(query, [
          booking.id,
          booking.eventId,
          booking.userId,
          booking.numberOfTickets,
          booking.status,
          0,
          booking.createdAt,
          booking.updatedAt,
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

  async findByEventId(eventId, pagination) {
    const params = pagination || { page: 1, limit: 10 };
    const offset = PaginationUtil.calculateOffset(params.page || 1, params.limit || 10);

    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE event_id = $1`;
    const countResult = await db.query(countQuery, [eventId]);
    const total = parseInt(countResult.rows[0].total, 10);

    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE event_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [eventId, params.limit || 10, offset]);

    return {
      bookings: result.rows.map((row) => this.mapRowToEntity(row)),
      total,
    };
  }

  async update(booking, expectedVersion, client) {
    let query;
    let params;

    if (expectedVersion !== undefined) {
      query = `
        UPDATE ${this.tableName}
        SET status = $2, number_of_tickets = $3, 
            version = version + 1, updated_at = $4
        WHERE id = $1 AND version = $5
        RETURNING *
      `;
      params = [
        booking.id,
        booking.status,
        booking.numberOfTickets,
        booking.updatedAt,
        expectedVersion,
      ];
    } else {
      query = `
        UPDATE ${this.tableName}
        SET status = $2, number_of_tickets = $3, 
            version = version + 1, updated_at = $4
        WHERE id = $1
        RETURNING *
      `;
      params = [
        booking.id,
        booking.status,
        booking.numberOfTickets,
        booking.updatedAt,
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

  async getTotalBookedTicketsForEvent(eventId, client) {
    const query = `
      SELECT COALESCE(SUM(number_of_tickets), 0) as total
      FROM ${this.tableName}
      WHERE event_id = $1 AND status IN ($2, $3)
    `;

    const result = client
      ? await client.query(query, [eventId, BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED])
      : await db.query(query, [eventId, BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED]);

    return parseInt(result.rows[0].total, 10);
  }

  mapRowToEntity(row) {
    return new Booking({
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      numberOfTickets: row.number_of_tickets,
      status: row.status,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = { BookingRepository };

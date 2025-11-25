const { db } = require('../utils/database.connection');
const { WaitingList } = require('../model/entity/waiting-list.entity');
const { WAITING_LIST_STATUS } = require('../constants');

class WaitingListRepository {
  constructor() {
    this.tableName = 'waiting_list';
  }

  async create(waitingList, client) {
    const query = `
      INSERT INTO ${this.tableName} 
      (id, event_id, user_id, number_of_tickets, priority, status, notified_at, fulfilled_at, version, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = client
      ? await client.query(query, [
          waitingList.id,
          waitingList.eventId,
          waitingList.userId,
          waitingList.numberOfTickets,
          waitingList.priority,
          waitingList.status,
          waitingList.notifiedAt || null,
          waitingList.fulfilledAt || null,
          waitingList.version ?? 0,
          waitingList.createdAt,
          waitingList.updatedAt,
        ])
      : await db.query(query, [
          waitingList.id,
          waitingList.eventId,
          waitingList.userId,
          waitingList.numberOfTickets,
          waitingList.priority,
          waitingList.status,
          waitingList.notifiedAt || null,
          waitingList.fulfilledAt || null,
          waitingList.version ?? 0,
          waitingList.createdAt,
          waitingList.updatedAt,
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

  async findByEventId(eventId, status, client) {
    let query;
    let params;

    if (status) {
      query = `
        SELECT * FROM ${this.tableName}
        WHERE event_id = $1 AND status = $2
        ORDER BY priority DESC, created_at ASC
        FOR UPDATE SKIP LOCKED
      `;
      params = [eventId, status];
    } else {
      query = `
        SELECT * FROM ${this.tableName}
        WHERE event_id = $1
        ORDER BY priority DESC, created_at ASC
      `;
      params = [eventId];
    }

    const result = client
      ? await client.query(query, params)
      : await db.query(query, params);

    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  async getNextPendingEntry(eventId, client) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE event_id = $1 AND status = $2
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    const result = client
      ? await client.query(query, [eventId, WAITING_LIST_STATUS.PENDING])
      : await db.query(query, [eventId, WAITING_LIST_STATUS.PENDING]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async update(waitingList, expectedVersion, client) {
    let query;
    let params;

    if (expectedVersion !== undefined) {
      query = `
        UPDATE ${this.tableName}
        SET status = $2, priority = $3, notified_at = $4, fulfilled_at = $5,
            version = version + 1, updated_at = $6
        WHERE id = $1 AND version = $7
        RETURNING *
      `;
      params = [
        waitingList.id,
        waitingList.status,
        waitingList.priority,
        waitingList.notifiedAt || null,
        waitingList.fulfilledAt || null,
        waitingList.updatedAt,
        expectedVersion,
      ];
    } else {
      query = `
        UPDATE ${this.tableName}
        SET status = $2, priority = $3, notified_at = $4, fulfilled_at = $5,
            version = version + 1, updated_at = $6
        WHERE id = $1
        RETURNING *
      `;
      params = [
        waitingList.id,
        waitingList.status,
        waitingList.priority,
        waitingList.notifiedAt || null,
        waitingList.fulfilledAt || null,
        waitingList.updatedAt,
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

  async getNextPriority(eventId) {
    const query = `
      SELECT COALESCE(MAX(priority), 0) + 1 as next_priority
      FROM ${this.tableName}
      WHERE event_id = $1
    `;

    const result = await db.query(query, [eventId]);
    return parseInt(result.rows[0].next_priority, 10);
  }

  mapRowToEntity(row) {
    return new WaitingList({
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      numberOfTickets: row.number_of_tickets,
      priority: row.priority,
      status: row.status,
      notifiedAt: row.notified_at || undefined,
      fulfilledAt: row.fulfilled_at || undefined,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = { WaitingListRepository };

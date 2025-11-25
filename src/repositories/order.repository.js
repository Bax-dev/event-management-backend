const { db } = require('../utils/database.connection');
const { Order } = require('../model/entity/order.entity');

class OrderRepository {
  constructor() {
    this.tableName = 'orders';
  }

  async create(order, client) {
    const query = `
      INSERT INTO ${this.tableName} 
      (id, user_id, event_id, booking_id, order_number, total_amount, currency, status, payment_status, payment_method, payment_transaction_id, customer_name, customer_email, customer_phone, billing_address, notes, version, created_at, updated_at, paid_at, cancelled_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const result = client
      ? await client.query(query, [
          order.id,
          order.userId,
          order.eventId,
          order.bookingId,
          order.orderNumber,
          order.totalAmount,
          order.currency,
          order.status,
          order.paymentStatus,
          order.paymentMethod || null,
          order.paymentTransactionId || null,
          order.customerName || null,
          order.customerEmail || null,
          order.customerPhone || null,
          order.billingAddress || null,
          order.notes || null,
          order.version ?? 0,
          order.createdAt,
          order.updatedAt,
          order.paidAt || null,
          order.cancelledAt || null,
        ])
      : await db.query(query, [
          order.id,
          order.userId,
          order.eventId,
          order.bookingId,
          order.orderNumber,
          order.totalAmount,
          order.currency,
          order.status,
          order.paymentStatus,
          order.paymentMethod || null,
          order.paymentTransactionId || null,
          order.customerName || null,
          order.customerEmail || null,
          order.customerPhone || null,
          order.billingAddress || null,
          order.notes || null,
          order.version ?? 0,
          order.createdAt,
          order.updatedAt,
          order.paidAt || null,
          order.cancelledAt || null,
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

  async findByOrderNumber(orderNumber) {
    const query = `SELECT * FROM ${this.tableName} WHERE order_number = $1`;
    const result = await db.query(query, [orderNumber]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async findByUserId(userId, pagination) {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } =
      pagination || {};
    const offset = (page - 1) * limit;

    const sortField = this.mapColumnToField(sortBy);

    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE user_id = $1`;
    const countResult = await db.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total, 10);

    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);

    return {
      orders: result.rows.map((row) => this.mapRowToEntity(row)),
      total,
    };
  }

  async findByEventId(eventId, pagination) {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } =
      pagination || {};
    const offset = (page - 1) * limit;

    const sortField = this.mapColumnToField(sortBy);

    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE event_id = $1`;
    const countResult = await db.query(countQuery, [eventId]);
    const total = parseInt(countResult.rows[0].total, 10);

    const query = `
      SELECT * FROM ${this.tableName}
      WHERE event_id = $1
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [eventId, limit, offset]);

    return {
      orders: result.rows.map((row) => this.mapRowToEntity(row)),
      total,
    };
  }

  async findByBookingId(bookingId) {
    const query = `SELECT * FROM ${this.tableName} WHERE booking_id = $1`;
    const result = await db.query(query, [bookingId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async update(order, expectedVersion, client) {
    let query;
    let params;

    if (expectedVersion !== undefined) {
      query = `
        UPDATE ${this.tableName}
        SET status = $2, payment_status = $3, payment_method = $4, 
            payment_transaction_id = $5, customer_name = $6, customer_email = $7,
            customer_phone = $8, billing_address = $9, notes = $10,
            paid_at = $11, cancelled_at = $12,
            version = version + 1, updated_at = $13
        WHERE id = $1 AND version = $14
        RETURNING *
      `;
      params = [
        order.id,
        order.status,
        order.paymentStatus,
        order.paymentMethod || null,
        order.paymentTransactionId || null,
        order.customerName || null,
        order.customerEmail || null,
        order.customerPhone || null,
        order.billingAddress || null,
        order.notes || null,
        order.paidAt || null,
        order.cancelledAt || null,
        order.updatedAt,
        expectedVersion,
      ];
    } else {
      query = `
        UPDATE ${this.tableName}
        SET status = $2, payment_status = $3, payment_method = $4, 
            payment_transaction_id = $5, customer_name = $6, customer_email = $7,
            customer_phone = $8, billing_address = $9, notes = $10,
            paid_at = $11, cancelled_at = $12,
            version = version + 1, updated_at = $13
        WHERE id = $1
        RETURNING *
      `;
      params = [
        order.id,
        order.status,
        order.paymentStatus,
        order.paymentMethod || null,
        order.paymentTransactionId || null,
        order.customerName || null,
        order.customerEmail || null,
        order.customerPhone || null,
        order.billingAddress || null,
        order.notes || null,
        order.paidAt || null,
        order.cancelledAt || null,
        order.updatedAt,
      ];
    }

    const result = client
      ? await client.query(query, params)
      : await db.query(query, params);

    if (result.rows.length === 0) {
      throw new Error('Order not found or version mismatch');
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

  mapColumnToField(field) {
    const fieldMap = {
      createdAt: 'created_at',
      created_at: 'created_at',
      updatedAt: 'updated_at',
      updated_at: 'updated_at',
      totalAmount: 'total_amount',
      total_amount: 'total_amount',
      orderNumber: 'order_number',
      order_number: 'order_number',
      userId: 'user_id',
      user_id: 'user_id',
      eventId: 'event_id',
      event_id: 'event_id',
      bookingId: 'booking_id',
      booking_id: 'booking_id',
      paymentStatus: 'payment_status',
      payment_status: 'payment_status',
      paymentMethod: 'payment_method',
      payment_method: 'payment_method',
      paymentTransactionId: 'payment_transaction_id',
      payment_transaction_id: 'payment_transaction_id',
      customerName: 'customer_name',
      customer_name: 'customer_name',
      customerEmail: 'customer_email',
      customer_email: 'customer_email',
      customerPhone: 'customer_phone',
      customer_phone: 'customer_phone',
      billingAddress: 'billing_address',
      billing_address: 'billing_address',
      paidAt: 'paid_at',
      paid_at: 'paid_at',
      cancelledAt: 'cancelled_at',
      cancelled_at: 'cancelled_at',
    };

    return fieldMap[field] || 'created_at';
  }

  mapRowToEntity(row) {
    return new Order({
      id: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      bookingId: row.booking_id,
      orderNumber: row.order_number,
      totalAmount: parseFloat(row.total_amount),
      currency: row.currency,
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method || undefined,
      paymentTransactionId: row.payment_transaction_id || undefined,
      customerName: row.customer_name || undefined,
      customerEmail: row.customer_email || undefined,
      customerPhone: row.customer_phone || undefined,
      billingAddress: row.billing_address || undefined,
      notes: row.notes || undefined,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      paidAt: row.paid_at || undefined,
      cancelledAt: row.cancelled_at || undefined,
    });
  }
}

module.exports = { OrderRepository };

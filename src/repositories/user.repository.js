const { db } = require('../utils/database.connection');
const { User } = require('../model/entity/user.entity');

class UserRepository {
  constructor() {
    this.tableName = 'users';
  }

  async create(user, client) {
    const query = `
      INSERT INTO ${this.tableName} 
      (id, email, password_hash, name, phone, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = client
      ? await client.query(query, [
          user.id,
          user.email.toLowerCase(),
          user.passwordHash,
          user.name || null,
          user.phone || null,
          user.isActive,
          user.createdAt,
          user.updatedAt,
        ])
      : await db.query(query, [
          user.id,
          user.email.toLowerCase(),
          user.passwordHash,
          user.name || null,
          user.phone || null,
          user.isActive,
          user.createdAt,
          user.updatedAt,
        ]);

    return this.mapRowToEntity(result.rows[0]);
  }

  async findByEmail(email, client) {
    const query = `SELECT * FROM ${this.tableName} WHERE email = $1`;
    const result = client
      ? await client.query(query, [email.toLowerCase()])
      : await db.query(query, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return null;
    }

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

  async updateLastLogin(id, client) {
    const query = `
      UPDATE ${this.tableName}
      SET last_login = $1, updated_at = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = client
      ? await client.query(query, [new Date(), id])
      : await db.query(query, [new Date(), id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  mapRowToEntity(row) {
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      phone: row.phone,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLogin: row.last_login,
    });
  }
}

module.exports = { UserRepository };


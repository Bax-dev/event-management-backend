const { db } = require('../utils/database.connection');

class TokenBlacklistRepository {
  constructor() {
    this.tableName = 'token_blacklist';
  }

  async addToken(token, userId, expiresAt, client) {
    const query = `
      INSERT INTO ${this.tableName} (token, user_id, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (token) DO NOTHING
      RETURNING *
    `;

    const result = client
      ? await client.query(query, [token, userId, expiresAt])
      : await db.query(query, [token, userId, expiresAt]);

    return result.rows[0] || null;
  }

  async isTokenBlacklisted(token) {
    const query = `
      SELECT id FROM ${this.tableName}
      WHERE token = $1 AND expires_at > NOW()
      LIMIT 1
    `;

    const result = await db.query(query, [token]);
    return result.rows.length > 0;
  }

  async deleteExpiredTokens() {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE expires_at <= NOW()
    `;

    const result = await db.query(query);
    return result.rowCount;
  }

  async deleteTokensByUserId(userId) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    return result.rowCount;
  }
}

module.exports = { TokenBlacklistRepository };


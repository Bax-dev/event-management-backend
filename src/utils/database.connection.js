const { Pool } = require('pg');
const { getDatabaseConfig } = require('../config/database.config');
const { LoggerUtil } = require('./logger.util');

class DatabaseConnection {
  constructor() {
    this.pool = null;
  }

  connect() {
    if (!this.pool) {
      const config = getDatabaseConfig();
      this.pool = new Pool(config);

      this.pool.on('error', (err) => {
        LoggerUtil.error('Unexpected error on idle client', err);
        process.exit(-1);
      });

      this.pool.on('connect', () => {
        LoggerUtil.info('Database connection established');
      });
    }

    return this.pool;
  }

  async query(text, params) {
    if (!this.pool) {
      this.connect();
    }

    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      LoggerUtil.logQuery(text, duration, result.rowCount ?? 0);
      return result;
    } catch (error) {
      LoggerUtil.error('Query error', error, { query: text });
      throw error;
    }
  }

  async getClient() {
    if (!this.pool) {
      this.connect();
    }

    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    return this.pool.connect();
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      LoggerUtil.info('Database connection pool closed');
    }
  }

  async testConnection() {
    try {
      const result = await this.query('SELECT NOW()');
      return result.rowCount === 1;
    } catch (error) {
      LoggerUtil.error('Database connection test failed', error);
      return false;
    }
  }
}

const db = new DatabaseConnection();

module.exports = { db, DatabaseConnection };

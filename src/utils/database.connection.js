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

    try {
      const result = await this.pool.query(text, params);
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

  async ensureDatabase() {
    const config = getDatabaseConfig();
    const dbName = config.database;
    
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbName)) {
      throw new Error(`Invalid database name: ${dbName}. Database names must start with a letter or underscore and contain only alphanumeric characters and underscores.`);
    }
    
    const adminConfig = {
      ...config,
      database: 'postgres',
      ssl: config.ssl,
    };

    const adminPool = new Pool(adminConfig);

    try {
      const checkQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
      const result = await adminPool.query(checkQuery, [dbName]);

      if (result.rows.length === 0) {
        await adminPool.query(`CREATE DATABASE "${dbName}"`);
        LoggerUtil.info(`Database '${dbName}' created successfully`);
      }
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        return;
      }
      throw new Error(`Failed to ensure database '${dbName}' exists: ${error.message}`);
    } finally {
      await adminPool.end();
    }
  }
}

const db = new DatabaseConnection();

module.exports = { db, DatabaseConnection };

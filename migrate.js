const dotenv = require('dotenv');
dotenv.config();

const { db } = require('./src/utils/database.connection');
const fs = require('fs');
const path = require('path');

/**
 * Simple migration runner for PostgreSQL
 * Reads migration files from migrations/ directory and executes them
 */
class MigrationRunner {
  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.migrationsTable = 'pgmigrations';
  }

  async ensureMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(query);
  }

  async getExecutedMigrations() {
    const query = `SELECT name FROM ${this.migrationsTable} ORDER BY id`;
    const result = await db.query(query);
    return result.rows.map((row) => row.name);
  }

  async recordMigration(name) {
    const query = `INSERT INTO ${this.migrationsTable} (name) VALUES ($1)`;
    await db.query(query, [name]);
  }

  async removeMigration(name) {
    const query = `DELETE FROM ${this.migrationsTable} WHERE name = $1`;
    await db.query(query, [name]);
  }

  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }
    return fs
      .readdirSync(this.migrationsDir)
      .filter((file) => file.endsWith('.js'))
      .sort();
  }

  async runMigrations() {
    await this.ensureMigrationsTable();
    const executed = await this.getExecutedMigrations();
    const files = this.getMigrationFiles();

    console.log(`Found ${files.length} migration files`);
    console.log(`Already executed: ${executed.length} migrations`);

    for (const file of files) {
      if (executed.includes(file)) {
        console.log(`✓ ${file} - already executed`);
        continue;
      }

      console.log(`Running migration: ${file}...`);
      const migration = require(path.join(this.migrationsDir, file));

      try {
        await db.query('BEGIN');
        await migration.up({ query: db.query.bind(db), sql: db.query.bind(db) });
        await this.recordMigration(file);
        await db.query('COMMIT');
        console.log(`✓ ${file} - completed`);
      } catch (error) {
        await db.query('ROLLBACK');
        console.error(`✗ ${file} - failed:`, error.message);
        throw error;
      }
    }

    console.log('All migrations completed successfully!');
  }

  async rollbackMigration(name) {
    const executed = await this.getExecutedMigrations();
    if (!executed.includes(name)) {
      console.log(`Migration ${name} has not been executed`);
      return;
    }

    console.log(`Rolling back migration: ${name}...`);
    const migration = require(path.join(this.migrationsDir, name));

    try {
      await db.query('BEGIN');
      await migration.down({ query: db.query.bind(db), sql: db.query.bind(db) });
      await this.removeMigration(name);
      await db.query('COMMIT');
      console.log(`✓ ${name} - rolled back successfully`);
    } catch (error) {
      await db.query('ROLLBACK');
      console.error(`✗ ${name} - rollback failed:`, error.message);
      throw error;
    }
  }

  async rollbackLast() {
    const executed = await this.getExecutedMigrations();
    if (executed.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = executed[executed.length - 1];
    await this.rollbackMigration(lastMigration);
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const migrationName = process.argv[3];

  const runner = new MigrationRunner();

  try {
    // Connect to database
    const { db } = require('./src/utils/database.connection');
    db.connect();

    switch (command) {
      case 'up':
      case 'migrate':
        await runner.runMigrations();
        break;

      case 'down':
      case 'rollback':
        if (migrationName) {
          await runner.rollbackMigration(migrationName);
        } else {
          await runner.rollbackLast();
        }
        break;

      case 'status':
        await runner.ensureMigrationsTable();
        const executed = await runner.getExecutedMigrations();
        const files = runner.getMigrationFiles();
        console.log('\nMigration Status:');
        console.log('================');
        files.forEach((file) => {
          const status = executed.includes(file) ? '✓ Executed' : '○ Pending';
          console.log(`${status} - ${file}`);
        });
        break;

      default:
        console.log(`
Usage: node migrate.js <command> [migration_name]

Commands:
  up, migrate          Run all pending migrations
  down, rollback      Rollback last migration or specific migration
  status              Show migration status

Examples:
  node migrate.js up
  node migrate.js down
  node migrate.js down 003_create_events_table.js
  node migrate.js status
        `);
        process.exit(1);
    }

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MigrationRunner };


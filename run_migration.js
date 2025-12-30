require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const pool = require('./services/db'); // Usar el pool de PostgreSQL
const logger = require('./utils/logger');

const MIGRATIONS_TABLE = 'migrations';

async function ensureMigrationsTable() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } finally {
        client.release();
    }
}

async function getAppliedMigrations() {
    const client = await pool.connect();
    try {
        const result = await client.query(`SELECT name FROM ${MIGRATIONS_TABLE}`);
        return new Set(result.rows.map(row => row.name));
    } finally {
        client.release();
    }
}

async function runMigrations() {
    logger.info('Starting database migration process...');

    try {
        await ensureMigrationsTable();
        logger.info('Migrations table ensured.');

        const appliedMigrations = await getAppliedMigrations();
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = await fs.readdir(migrationsDir);

        migrationFiles.sort(); // Asegurar el orden de ejecución

        let migrationsApplied = 0;

        for (const file of migrationFiles) {
            if (file.endsWith('.sql') && !appliedMigrations.has(file)) {
                logger.info(`Applying migration: ${file}...`);
                const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
                
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    await client.query(sql);
                    await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [file]);
                    await client.query('COMMIT');
                    logger.info(`✅ Successfully applied migration: ${file}`);
                    migrationsApplied++;
                } catch (error) {
                    await client.query('ROLLBACK');
                    logger.error(`❌ Failed to apply migration ${file}:`, error);
                    throw error; // Detener el proceso si una migración falla
                } finally {
                    client.release();
                }
            }
        }

        if (migrationsApplied === 0) {
            logger.info('Database is already up to date.');
        } else {
            logger.info(`Migration process finished. Applied ${migrationsApplied} new migrations.`);
        }

    } catch (error) {
        logger.error('Migration process failed:', error);
    } finally {
        await pool.end(); // Cerrar el pool de conexiones
    }
}

if (require.main === module) {
    runMigrations();
}

/**
 * This file handles all PostgreSQL + Drizzle setup.
 * It connects to the database once and exports the
 * `db` instance to be reused throughout the app.
 *
 * Design Pattern Used:
 *  - Singleton Pattern: Ensures one DB connection across app.
 *  - Separation of Concerns: DB connection logic isolated here.
 *  - Connection Pooling Pattern:
 *      Efficient management of multiple DB connections.
 *
 * PostgreSQL + Drizzle setup with AWS RDS SSL support
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/env';
import logger from '@/core/logger';
import * as schema from './schemas';

const connectionString = env.DATABASE_URL as string;
const isTest = env.NODE_ENV === 'test';

// AWS RDS connection pool with SSL
const pool = new Pool({
  connectionString,
  ssl: isTest ? false : { rejectUnauthorized: false }, // Required for AWS RDS
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

// Initialize Drizzle ORM
export const db = drizzle(pool, {
  schema,
  logger: env.NODE_ENV === 'development',
});

export { pool };

/**
 * Initialize database connection
 */
export async function initDb(): Promise<void> {
  try {
    logger.info('Connecting to database...', {
      host: connectionString.match(/@([^:]+)/)?.[1],
      database: connectionString.match(/\/([^/?]+)(?:\?|$)/)?.[1],
    });

    // Test the connection with a simple query
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');

    logger.info('Database connected successfully', {
      currentTime: result.rows[0].current_time,
      postgresVersion: result.rows[0].pg_version.split(' ')[1],
      host: connectionString.match(/@([^:]+)/)?.[1],
    });

    client.release();
  } catch (error) {
    logger.error('Database connection failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      // code: (error as any)?.code,
    });
    process.exit(1);
  }
}

/**
 * Close database connections
 */
export async function closeDb(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', closeDb);
process.on('SIGTERM', closeDb);

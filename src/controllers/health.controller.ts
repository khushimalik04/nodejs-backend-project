/**
 * Health Controller
 *
 * Provides endpoints for monitoring application and database health.
 * Used for health checks, monitoring, and debugging database connectivity.
 *
 * Design Pattern Used:
 *  - Controller Pattern: Encapsulates health check logic
 *  - Health Check Pattern: Standardized health monitoring
 *  - Error Handling Pattern: Graceful error responses
 *
 * @module controllers/health.controller
 * @requires express
 * @requires @/db
 * @requires @/utils/asyncHandler
 * @requires @/utils/errorHandler
 * @exports healthHandler - Basic application health check
 * @exports dbHealthHandler - Database connectivity health check
 */

import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { count } from 'drizzle-orm';
import { asyncHandler } from '@/utils/asyncHandler';
import ErrorHandler from '@/utils/errorHandler';
import { db, pool } from '@/db';
import { users } from '@/db/schemas';
import logger from '@/core/logger';

/**
 * Basic Health Check Handler
 * - Returns application status and basic information
 * - Used for load balancer health checks
 *
 * @route GET /api/health
 * @returns Application health status
 * @exports healthHandler
 */
export const healthHandler = asyncHandler(async (_req: ExpressRequest, res: ExpressResponse) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version ?? '1.0.0',
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
    },
  };

  logger.info('Health check requested', { status: 'healthy' });

  res.status(200).json({
    success: true,
    message: 'Application is healthy',
    data: healthData,
  });
});

/**
 * Database Health Check Handler
 * - Tests database connectivity and basic operations
 * - Measures query response times
 * - Checks table accessibility
 *
 * @route GET /api/health/db
 * @returns Database health status with connection details
 * @throws InternalServerError if database is unreachable
 * @exports dbHealthHandler
 */
export const dbHealthHandler = asyncHandler(async (_req: ExpressRequest, res: ExpressResponse) => {
  const startTime = Date.now();

  try {
    logger.info('Database health check started');

    // Test 1: Basic connectivity with raw query using node-postgres
    const connectivityStart = Date.now();
    const client = await pool.connect();
    const connectivityResult = await client.query('SELECT NOW() as current_time, version() as pg_version');
    const connectivityTime = Date.now() - connectivityStart;
    client.release();

    // Test 2: Test Drizzle ORM functionality
    const drizzleStart = Date.now();
    const drizzleTest = await db.select({ count: count() }).from(users);
    const drizzleTime = Date.now() - drizzleStart;

    // Test 3: Test table accessibility
    const tablesStart = Date.now();
    const tablesClient = await pool.connect();
    const tablesResult = await tablesClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const tablesTime = Date.now() - tablesStart;
    tablesClient.release();

    const totalTime = Date.now() - startTime;

    const dbHealthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        version: connectivityResult.rows[0].pg_version,
        currentTime: connectivityResult.rows[0].current_time,
        userCount: drizzleTest[0].count,
        totalTables: tablesResult.rows.length,
        tables: tablesResult.rows.map((row: { table_name: string }) => row.table_name),
      },
      performance: {
        connectivity: {
          responseTime: connectivityTime,
          status: connectivityTime < 1000 ? 'excellent' : connectivityTime < 3000 ? 'good' : 'slow',
        },
        drizzle: {
          responseTime: drizzleTime,
          status: drizzleTime < 500 ? 'excellent' : drizzleTime < 1500 ? 'good' : 'slow',
        },
        tables: {
          responseTime: tablesTime,
          status: tablesTime < 500 ? 'excellent' : tablesTime < 1500 ? 'good' : 'slow',
        },
        overall: {
          responseTime: totalTime,
          status: totalTime < 1000 ? 'excellent' : totalTime < 3000 ? 'good' : 'slow',
        },
      },
    };

    logger.info('Database health check completed', {
      status: 'healthy',
      totalTime,
      userCount: drizzleTest[0].count,
      tableCount: tablesResult.rows.length,
    });

    res.status(200).json({
      success: true,
      message: 'Database is healthy',
      data: dbHealthData,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;

    logger.error('Database health check failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      responseTime: totalTime,
    });

    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
        code: (error as any)?.code,
        responseTime: totalTime,
      },
    };

    // Return 503 Service Unavailable for database issues
    throw ErrorHandler.ServiceUnavailable('Database health check failed', errorData);
  }
});

/**
 * Detailed Health Check Handler
 * - Combines application and database health
 * - Provides comprehensive system status
 *
 * @route GET /api/health/detailed
 * @returns Comprehensive health status
 * @exports detailedHealthHandler
 */
export const detailedHealthHandler = asyncHandler(async (_req: ExpressRequest, res: ExpressResponse) => {
  const startTime = Date.now();

  try {
    logger.info('Detailed health check started');

    // Get application health
    const appHealth = {
      status: 'healthy',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version ?? '1.0.0',
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
      },
    };

    // Get database health
    const dbStart = Date.now();
    const dbClient = await pool.connect();
    const connectivityResult = await dbClient.query('SELECT NOW() as current_time, version() as pg_version');
    dbClient.release();

    const userCountTest = await db.select({ count: count() }).from(users);
    const dbTime = Date.now() - dbStart;

    const dbHealth = {
      status: 'healthy',
      connected: true,
      version: connectivityResult.rows[0].pg_version,
      responseTime: dbTime,
      userCount: userCountTest[0].count,
    };

    const totalTime = Date.now() - startTime;

    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: totalTime,
      application: appHealth,
      database: dbHealth,
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
      },
    };

    logger.info('Detailed health check completed', {
      status: 'healthy',
      totalTime,
      dbResponseTime: dbTime,
    });

    res.status(200).json({
      success: true,
      message: 'System is healthy',
      data: detailedHealth,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;

    logger.error('Detailed health check failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: totalTime,
    });

    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: totalTime,
      application: { status: 'healthy' },
      database: {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };

    throw ErrorHandler.ServiceUnavailable('System health check failed', errorData);
  }
});

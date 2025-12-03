/**
 * Health Routes
 *
 * Defines routes for health check endpoints.
 * Used by load balancers, monitoring systems, and debugging.
 *
 * @module routes/health.routes
 * @requires express
 * @requires @/controllers/health.controller
 */

import { Router } from 'express';
import { healthHandler, dbHealthHandler, detailedHealthHandler } from '@/controllers/health.controller';

const router: Router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic application health check
 *     description: Returns basic application health status including uptime, memory usage, and environment info
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Application is healthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       description: Application uptime in seconds
 *                       example: 1234.567
 *                     environment:
 *                       type: string
 *                       example: "development"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: number
 *                           description: Used memory in MB
 *                           example: 45.32
 *                         total:
 *                           type: number
 *                           description: Total memory in MB
 *                           example: 128.64
 *                         rss:
 *                           type: number
 *                           description: RSS memory in MB
 *                           example: 67.89
 */
router.get('/', healthHandler);

/**
 * @swagger
 * /api/health/db:
 *   get:
 *     summary: Database health check
 *     description: Tests database connectivity, response times, and basic operations
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Database is healthy and accessible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Database is healthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     database:
 *                       type: object
 *                       properties:
 *                         connected:
 *                           type: boolean
 *                           example: true
 *                         version:
 *                           type: string
 *                           example: "PostgreSQL 17.6"
 *                         currentTime:
 *                           type: string
 *                           format: date-time
 *                         userCount:
 *                           type: number
 *                           example: 5
 *                         totalTables:
 *                           type: number
 *                           example: 5
 *                         tables:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["auth_tokens", "otp_codes", "reports", "tasks", "users"]
 *                     performance:
 *                       type: object
 *                       properties:
 *                         connectivity:
 *                           type: object
 *                           properties:
 *                             responseTime:
 *                               type: number
 *                               description: Response time in milliseconds
 *                               example: 45
 *                             status:
 *                               type: string
 *                               enum: ["excellent", "good", "slow"]
 *                               example: "excellent"
 *                         drizzle:
 *                           type: object
 *                           properties:
 *                             responseTime:
 *                               type: number
 *                               example: 32
 *                             status:
 *                               type: string
 *                               example: "excellent"
 *                         tables:
 *                           type: object
 *                           properties:
 *                             responseTime:
 *                               type: number
 *                               example: 28
 *                             status:
 *                               type: string
 *                               example: "excellent"
 *                         overall:
 *                           type: object
 *                           properties:
 *                             responseTime:
 *                               type: number
 *                               example: 105
 *                             status:
 *                               type: string
 *                               example: "excellent"
 *       503:
 *         description: Database is unhealthy or unreachable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/db', dbHealthHandler);

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Comprehensive system health check
 *     description: Returns detailed health information for both application and database
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "System is healthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       description: Total response time in milliseconds
 *                       example: 156
 *                     application:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         uptime:
 *                           type: number
 *                           example: 1234.567
 *                         environment:
 *                           type: string
 *                           example: "development"
 *                         version:
 *                           type: string
 *                           example: "1.0.0"
 *                         memory:
 *                           type: object
 *                           properties:
 *                             used:
 *                               type: number
 *                               example: 45.32
 *                             total:
 *                               type: number
 *                               example: 128.64
 *                             rss:
 *                               type: number
 *                               example: 67.89
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         connected:
 *                           type: boolean
 *                           example: true
 *                         version:
 *                           type: string
 *                           example: "PostgreSQL 17.6"
 *                         responseTime:
 *                           type: number
 *                           example: 89
 *                         userCount:
 *                           type: number
 *                           example: 5
 *                     system:
 *                       type: object
 *                       properties:
 *                         platform:
 *                           type: string
 *                           example: "linux"
 *                         arch:
 *                           type: string
 *                           example: "x64"
 *                         nodeVersion:
 *                           type: string
 *                           example: "v20.11.0"
 *                         pid:
 *                           type: number
 *                           example: 12345
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/detailed', detailedHealthHandler);

export default router;

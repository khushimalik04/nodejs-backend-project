/**
 * Express server setup
 * - Configures middleware, routes, and error handling
 * - Uses security best practices with Helmet
 * - Enables CORS for specified origins
 * Exports the configured Express application
 *
 * @module server
 * @requires express
 * @requires cors
 * @requires helmet
 * @requires @/env
 * @requires @/routes/user.routes
 * @requires @/routes/todo.routes
 * @requires @/middlewares/error
 * @exports app - Configured Express application
 */
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from '@/env';
import { errorMiddleware } from '@/middlewares/error';
import { swaggerSpec } from '@/core/swagger';
import { asyncHandler } from '@/utils/asyncHandler';
import userRoutes from '@/routes/user.routes';
import authRoutes from '@/routes/auth.routes';
import taskRoutes from '@/routes/task.routes';
import healthRoutes from '@/routes/health.routes';

// Initialize Express app
const app: express.Application = express();

/**
 * Middleware Configuration
 * - JSON parsing
 * - URL-encoded data parsing
 * - CORS with specified origin
 * - Security headers with Helmet
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_URL as string, optionsSuccessStatus: 200 }));
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV !== 'development',
    crossOriginEmbedderPolicy: env.NODE_ENV !== 'development',
  }),
);

// Basic route for health check
app.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ status: 'healthy', message: `Visit API documentation at http://localhost:${env.PORT}/api-docs` });
  }),
);

/**
 * Swagger UI route
 * - Exposes the API documentation at /api-docs
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * API Routes
 * - User routes at /api/users
 * - Task routes at /api/tasks
 */
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

/**
 * 404 Handler
 * Catches all unmatched routes and returns a 404 response
 */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Page not found',
  });
});

/**
 * Global Error Handling Middleware
 * Catches errors thrown in routes and middlewares
 * Formats and sends error responses to the client
 * Differentiates between development and production environments
 * for verbosity of error information returned
 *
 * In development mode, detailed error information including stack traces
 * and metadata is included in the response to aid debugging.
 * In production mode, only essential error information is sent to avoid
 * leaking sensitive details.
 */
app.use(errorMiddleware);

export default app;

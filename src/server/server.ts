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
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import hpp from 'hpp';
import swaggerUi from 'swagger-ui-express';
import { env } from '@/env';
import { errorMiddleware } from '@/middlewares/error';
import { swaggerSpec } from '@/core/swagger';
import { asyncHandler } from '@/utils/asyncHandler';
import userRoutes from '@/routes/user.routes';
import authRoutes from '@/routes/auth.routes';
import taskRoutes from '@/routes/task.routes';

// Initialize Express app
const app: express.Application = express();

/**
 * Middleware Configuration
 * - JSON parsing with size limits
 * - URL-encoded data parsing
 * - CORS with specified origin and credentials
 * - Security headers with Helmet
 * - Basic request protections (HPP)
 * - Global rate limiting
 */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS: enable credentials and allow configured origin(s)
const allowedOrigin = env.CORS_URL as string;
app.use(cors({ origin: allowedOrigin, credentials: true, optionsSuccessStatus: 200 }));

app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV !== 'development',
    crossOriginEmbedderPolicy: env.NODE_ENV !== 'development',
  }),
);

// Protect against HTTP Parameter Pollution
app.use(hpp());

// Global rate limiter (light touch)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
});
app.use(globalLimiter);

// CSRF protection using cookies. This requires clients to fetch a token
// (GET /api/auth/csrf-token) and include it in the `x-csrf-token` header
// for state-changing requests when using cookie-based auth.
const csrfProtection = csurf({ cookie: { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict' } });
// Mount CSRF protection on API routes that may use cookie auth
app.use('/api', csrfProtection);

// Login-specific rate limiter (protect auth endpoints)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again later.',
});

// Provide a CSRF token endpoint for browsers to fetch and include in state-changing requests
app.get('/api/auth/csrf-token', (req: Request, res: Response) => {
  try {
    // csurf middleware attached to /api will have populated req.csrfToken
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = (req as any).csrfToken?.();
    return res.json({ csrfToken: token });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to generate CSRF token' });
  }
});

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

/**
 * ----------------------
 * Note from the Developer
 * -----------------------
 *
 * Please make sure you are not using console.log statements for logging.
 * Instead, utilize the configured Winston logger available from '@/core/logger'.
 * This ensures consistent logging practices across the application.
 * The logger is set up to handle different log levels and formats based on the environment.
 *
 * @example:
 * import logger from '@/core/logger';
 * logger.info('User created successfully');
 * logger.error('Database connection failed');
 * logger.debug('Debugging info here');
 *
 * -----------------------
 *
 * Make sure to utilize the asyncHandler utility to wrap your async route handlers.
 * This helps in catching errors in async functions and passing them to the error middleware.
 * This utility is made to abstract repetitive try-catch blocks in async route handlers.
 * And maintain type safety across the application.
 *
 * Instead of this:
 * @example:
 * import { ErrorHandler } from '@/middlewares/error';
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await getUsers();
 *     res.status(200).json({
 *       success: true,
 *       message: 'Users retrieved',
 *       data: users
 *     });
 *   } catch (error) {
 *     next(new ErrorHandler('Failed to get users', 500, ErrorType.DATABASE_ERROR));
 *   }
 * });
 *
 * Use this:
 * @example:
 * import { asyncHandler } from '@/utils/asyncHandler';
 * router.get('/users', asyncHandler(async () => {
 *   const users = await getUsers();
 *   return Response.success(users, 'Users retrieved');
 * }));
 *
 * This ensures any error thrown in the async function is caught and passed to the error handling middleware.
 * This keeps the code clean and consistent.
 * So that Developers don't have to manually write try-catch blocks for every async route handler.
 * This improves maintainability and readability of the codebase.
 * And enhances developer experience by reducing boilerplate code.
 */

import type { Request } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schemas';
import { asyncHandler, Response, validate } from '@/utils/asyncHandler';
import ErrorHandler from '@/utils/errorHandler';
import logger from '@/core/logger';
import { authMiddleware } from '@/middlewares/auth.middleware';

// Basic health-like handler kept for backward compatibility
export const baseAPIHandler = asyncHandler(async () => {
  return Response.success({ message: 'Hello from the User API' }, 'OK');
});

// List users (protected)
export const listUsersHandler = asyncHandler(async (req: Request) => {
  const all = await db
    .select({ id: users.id, username: users.username, email: users.email, role: users.role, isVerified: users.isVerified, createdAt: users.createdAt })
    .from(users);

  return Response.success(all, 'Users retrieved');
});

// Get user by id (protected)
export const getUserByIdHandler = asyncHandler(async (req: Request) => {
  const { id } = req.params as { id: string };

  const [user] = await db
    .select({ id: users.id, username: users.username, email: users.email, role: users.role, isVerified: users.isVerified, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    throw ErrorHandler.NotFound('User not found');
  }

  return Response.success(user, 'User retrieved');
});

// Update user (protected)
const UpdateUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
});

export const updateUserHandler = asyncHandler(async (req: Request) => {
  const { id } = req.params as { id: string };
  const updateData = req.body as Record<string, unknown>;

  // Validate incoming update
  try {
    UpdateUserSchema.parse(updateData);
  } catch (err) {
    throw ErrorHandler.ValidationError('Invalid update data');
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!existing) {
    throw ErrorHandler.NotFound('User not found');
  }

  const updates: Record<string, unknown> = {};
  if (updateData.username !== undefined) updates.username = String(updateData.username).trim();
  if (updateData.email !== undefined) updates.email = String(updateData.email).trim();

  const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning({ id: users.id, username: users.username, email: users.email, role: users.role, isVerified: users.isVerified });

  if (!updated) throw ErrorHandler.InternalServerError('Failed to update user');

  logger.info('User updated', { userId: id });

  return Response.success(updated, 'User updated');
});

// Delete user (protected)
export const deleteUserHandler = asyncHandler(async (req: Request) => {
  const { id } = req.params as { id: string };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!existing) {
    throw ErrorHandler.NotFound('User not found');
  }

  await db.delete(users).where(eq(users.id, id));

  return Response.success(null, 'User deleted successfully');
});

// Get current logged-in user (protected)
export const getCurrentUserHandler = asyncHandler(async (req: Request & { user?: any }) => {
  const u = req.user;
  if (!u) throw ErrorHandler.AuthError('Not authenticated');

  const [user] = await db
    .select({ id: users.id, username: users.username, email: users.email, role: users.role, isVerified: users.isVerified, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, u.id))
    .limit(1);

  if (!user) throw ErrorHandler.NotFound('User not found');

  return Response.success(user, 'Current user');
});

// Export route wrappers with middleware
export const listUsersWithAuth = [authMiddleware, listUsersHandler];
export const getUserByIdWithAuth = [authMiddleware, getUserByIdHandler];
export const updateUserWithAuth = [authMiddleware, updateUserHandler];
export const deleteUserWithAuth = [authMiddleware, deleteUserHandler];
export const getCurrentUserWithAuth = [authMiddleware, getCurrentUserHandler];

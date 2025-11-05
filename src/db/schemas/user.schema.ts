/**
 * User Schema Definition using Drizzle ORM for PostgreSQL.
 * This schema defines the structure of the 'users' table
 * with comprehensive user management features including OAuth support.
 *
 * Design Pattern Used:
 *  - Schema Definition Pattern: Clear definition of DB schema.
 *  - Relational Mapping: Establishes relations with other tables.
 */

import { pgTable, varchar, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { authTokens } from './auth-token.schema';
import { tasks } from './task.schema';
import { otpCodes } from './otp-code.schema';
import { reports } from './report.schema';

/**
 * Users Table Definition
 *
 * Columns:
 * - id: Primary key, PostgreSQL UUID with gen_random_uuid().
 * - username: Username of the user.
 * - email: Unique email address for the user.
 * - password: Hashed password for authentication.
 * - role: User role (admin, user, etc.).
 * - profile_picture_url: URL to user's profile picture.
 * - is_verified: Boolean flag for email verification.
 * - google_connected: Boolean flag for Google OAuth connection.
 * - created_at: Timestamp of when the user was created.
 * - updated_at: Timestamp of when the user was last updated.
 */
export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: varchar('username', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  profilePictureUrl: varchar('profile_picture_url', { length: 500 }),
  isVerified: boolean('is_verified').default(false).notNull(),
  googleConnected: boolean('google_connected').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations for Users Table
 */
export const userRelations = relations(users, ({ many }) => ({
  authTokens: many(authTokens),
  tasks: many(tasks),
  otpCodes: many(otpCodes),
  reports: many(reports),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

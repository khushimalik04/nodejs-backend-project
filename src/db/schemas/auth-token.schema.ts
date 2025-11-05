/**
 * Auth Token Schema Definition using Drizzle ORM for PostgreSQL.
 * This schema handles OAuth tokens and session management.
 *
 * Design Pattern Used:
 *  - Token Management Pattern: Secure token storage and management.
 *  - OAuth Integration Pattern: Support for multiple OAuth providers.
 */

import { pgTable, varchar, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './user.schema';

/**
 * Auth Tokens Table Definition
 *
 * Columns:
 * - id: Primary key, UUID string.
 * - userId: Foreign key referencing users table.
 * - access_token: OAuth access token.
 * - refresh_token: OAuth refresh token.
 * - provider: OAuth provider (google, github, etc.).
 * - expiresAt: Token expiration timestamp.
 * - createdAt: Timestamp of when the token was created.
 */
export const authTokens = pgTable('auth_tokens', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Relations for Auth Tokens Table
 */
export const authTokenRelations = relations(authTokens, ({ one }) => ({
  user: one(users, {
    fields: [authTokens.userId],
    references: [users.id],
  }),
}));

// Type exports
export type AuthToken = typeof authTokens.$inferSelect;
export type NewAuthToken = typeof authTokens.$inferInsert;

/**
 * OTP Code Schema Definition using Drizzle ORM for PostgreSQL.
 * This schema handles one-time passwords for email verification and 2FA.
 *
 * Design Pattern Used:
 *  - Security Pattern: Secure OTP generation and verification.
 *  - Time-based Expiration Pattern: Automatic OTP expiration.
 */

import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './user.schema';

/**
 * OTP Codes Table Definition
 *
 * Columns:
 * - id: Primary key, UUID string.
 * - userId: Foreign key referencing users table.
 * - code: The OTP code (6-digit numeric).
 * - type: OTP type (email_verification, password_reset, 2fa, etc.).
 * - expiresAt: OTP expiration timestamp.
 * - createdAt: Timestamp of when the OTP was created.
 */
export const otpCodes = pgTable('otp_codes', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Relations for OTP Codes Table
 */
export const otpCodeRelations = relations(otpCodes, ({ one }) => ({
  user: one(users, {
    fields: [otpCodes.userId],
    references: [users.id],
  }),
}));

// Type exports
export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;

/**
 * Task Schema Definition using Drizzle ORM for PostgreSQL.
 * This schema handles task management with calendar integration.
 *
 * Design Pattern Used:
 *  - Task Management Pattern: Comprehensive task tracking.
 *  - Calendar Integration Pattern: Support for calendar events.
 */

import { pgTable, varchar, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './user.schema';

/**
 * Tasks Table Definition
 *
 * Columns:
 * - id: Primary key, UUID string.
 * - userId: Foreign key referencing users table.
 * - title: Task title.
 * - description: Detailed task description.
 * - status: Task status (pending, in_progress, completed, etc.).
 * - startTime: Task start time (stored in IST).
 * - endTime: Task end time (stored in IST).
 * - calendar_event_id: Associated calendar event ID.
 * - createdAt: Timestamp of when the task was created (stored in IST).
 * - updatedAt: Timestamp of when the task was last updated (stored in IST).
 *
 * Note: All timestamps are stored with timezone 'Asia/Kolkata' (IST - UTC+5:30)
 */
export const tasks = pgTable('tasks', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  startTime: timestamp('start_time', { withTimezone: true, mode: 'string' }),
  endTime: timestamp('end_time', { withTimezone: true, mode: 'string' }),
  calendarEventId: varchar('calendar_event_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$defaultFn(() => sql`timezone('Asia/Kolkata', now())`),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$defaultFn(() => sql`timezone('Asia/Kolkata', now())`),
});

/**
 * Relations for Tasks Table
 */
export const taskRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

// Type exports
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

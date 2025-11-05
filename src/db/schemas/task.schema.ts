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
 * - startTime: Task start time.
 * - endTime: Task end time.
 * - calendar_event_id: Associated calendar event ID.
 * - createdAt: Timestamp of when the task was created.
 * - updatedAt: Timestamp of when the task was last updated.
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
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  calendarEventId: varchar('calendar_event_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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

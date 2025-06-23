import { pgTable, serial, text, timestamp, boolean, varchar, jsonb, integer } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatar: text('avatar'),
  role: varchar('role', { length: 50 }).default('user'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Unused schema definitions removed

export const bulkOperations = pgTable('bulk_operations', {
  id: serial('id').primaryKey(),
  batchId: text('batch_id').notNull().unique(),
  userId: text('user_id').notNull(),
  operation: text('operation').notNull(),
  totalItems: integer('total_items').notNull(),
  successCount: integer('success_count').default(0),
  failedCount: integer('failed_count').default(0),
  skippedCount: integer('skipped_count').default(0),
  isCompleted: boolean('is_completed').default(false),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type BulkOperation = typeof bulkOperations.$inferSelect;
export type NewBulkOperation = typeof bulkOperations.$inferInsert;
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

// User sessions table
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  sessionToken: text('session_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Activity logging tables
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  operation: text('operation').notNull(), // 'bulk_download', 'bulk_delete', 'bulk_move', etc.
  itemType: text('item_type').notNull(), // 'file' or 'folder'
  itemId: text('item_id').notNull(),
  itemName: text('item_name').notNull(),
  status: text('status').notNull(), // 'success', 'failed', 'skipped'
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'), // Additional operation-specific data
  batchId: text('batch_id'), // Group related operations together
  processedAt: timestamp('processed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

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
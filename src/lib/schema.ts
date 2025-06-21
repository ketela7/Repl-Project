import { pgTable, serial, text, timestamp, boolean, varchar, jsonb, integer, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from "@auth/core/adapters"

// NextAuth.js users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

// NextAuth.js accounts table  
export const accounts = pgTable(
  'accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

// NextAuth.js sessions table
export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

// NextAuth.js verification tokens table
export const verificationTokens = pgTable(
  'verificationTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

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
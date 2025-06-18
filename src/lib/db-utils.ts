import { db } from './db';
import { users, userSessions, activityLogs, bulkOperations, type User, type NewUser, type ActivityLog, type NewActivityLog, type BulkOperation, type NewBulkOperation } from './schema';
import { eq, desc } from 'drizzle-orm';

// User functions
export async function createUser(userData: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(userData).returning();
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getAllUsers(): Promise<User[]> {
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUser(id: number, userData: Partial<NewUser>): Promise<User> {
  const [user] = await db
    .update(users)
    .set({ ...userData, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

// Session functions
export async function createSession(userId: number, sessionToken: string, expiresAt: Date) {
  const [session] = await db
    .insert(userSessions)
    .values({
      userId,
      sessionToken,
      expiresAt,
    })
    .returning();
  return session;
}

export async function getSession(sessionToken: string) {
  const [session] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.sessionToken, sessionToken));
  return session;
}

export async function deleteSession(sessionToken: string) {
  await db.delete(userSessions).where(eq(userSessions.sessionToken, sessionToken));
}

// Activity logging functions
export async function createBulkOperation(operationData: NewBulkOperation): Promise<BulkOperation> {
  const [operation] = await db.insert(bulkOperations).values(operationData).returning();
  return operation;
}

export async function updateBulkOperation(batchId: string, updates: Partial<BulkOperation>): Promise<BulkOperation> {
  const [operation] = await db
    .update(bulkOperations)
    .set(updates)
    .where(eq(bulkOperations.batchId, batchId))
    .returning();
  return operation;
}

export async function logActivity(activityData: NewActivityLog): Promise<ActivityLog> {
  const [activity] = await db.insert(activityLogs).values(activityData).returning();
  return activity;
}

export async function getActivityLogs(userId: string, limit: number = 50): Promise<ActivityLog[]> {
  return await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function getBulkOperations(userId: string, limit: number = 20): Promise<BulkOperation[]> {
  return await db
    .select()
    .from(bulkOperations)
    .where(eq(bulkOperations.userId, userId))
    .orderBy(desc(bulkOperations.createdAt))
    .limit(limit);
}
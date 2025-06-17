import { db } from './db';
import { users, userSessions, type User, type NewUser } from './schema';
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
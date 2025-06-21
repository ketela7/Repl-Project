
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { users, userSessions, activityLogs, bulkOperations } from '../src/lib/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(process.env.DATABASE_URL, { prepare: false });
const db = drizzle(client);

async function resetDatabase() {
  try {
    console.log('🗄️ Resetting database...');
    
    // Drop all tables in reverse order (due to foreign keys)
    await db.execute(sql`DROP TABLE IF EXISTS activity_logs CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS bulk_operations CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS user_sessions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    
    console.log('✅ All tables dropped successfully');
    
    // Push the schema to recreate tables
    console.log('🔄 Recreating tables...');
    
    await client.end();
    console.log('✅ Database reset completed!');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();

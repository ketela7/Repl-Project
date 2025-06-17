import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Create the connection string from DATABASE_URL
const connectionString = process.env.DATABASE_URL;

// Create the postgres client
const client = postgres(connectionString, { prepare: false });

// Create the drizzle instance
export const db = drizzle(client);
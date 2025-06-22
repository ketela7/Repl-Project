import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Create the connection string from DATABASE_URL
const connectionString = process.env.DATABASE_URL;

// Create the postgres client with optimized connection pooling
const client = postgres(connectionString, { 
  prepare: false,
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 30 // Close connections after 30 minutes
});

// Create the drizzle instance
export const db = drizzle(client);
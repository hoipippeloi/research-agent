import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

/**
 * Get the database connection URL from environment variables
 * Priority: DATABASE_URL > POSTGRES_URL
 */
const getDatabaseUrl = (): string | undefined => {
  return env.DATABASE_URL || env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
};

const DATABASE_URL = getDatabaseUrl();

// Lazy-loaded database client
let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Initialize and return the database client
 * Uses lazy initialization to avoid connecting until needed
 */
export function getDb() {
  if (!DATABASE_URL) {
    throw new Error(
      'DATABASE_URL or POSTGRES_URL environment variable is not set. ' +
      'Please add it to your .env file or environment.'
    );
  }

  if (!client) {
    // Create postgres connection with optimized settings
    client = postgres(DATABASE_URL, {
      max: 10, // Connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
    });

    // Create drizzle client with schema
    db = drizzle(client, { schema });
  }

  return db;
}

/**
 * Get the raw postgres client for direct queries
 * Use this for advanced operations not supported by Drizzle
 */
export function getRawClient() {
  if (!DATABASE_URL) {
    throw new Error(
      'DATABASE_URL or POSTGRES_URL environment variable is not set. ' +
      'Please add it to your .env file or environment.'
    );
  }

  if (!client) {
    getDb(); // Initialize the client
  }

  return client!;
}

/**
 * Close the database connection
 * Call this when shutting down the application
 */
export async function closeDb() {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}

/**
 * Check if database is configured and available
 */
export function isDatabaseConfigured(): boolean {
  return !!DATABASE_URL;
}

// Export schema types and tables for convenience
export * from './schema';

// Export a default db instance getter
export default getDb;

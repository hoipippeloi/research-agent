import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.warn('Warning: DATABASE_URL or POSTGRES_URL not found in environment variables');
}

export default defineConfig({
  // Schema configuration
  schema: './src/lib/db/schema.ts',

  // Output directory for generated migrations
  out: './drizzle',

  // Database driver
  dialect: 'postgresql',

  // Database connection
  dbCredentials: {
    url: databaseUrl || 'postgresql://localhost:5432/research_agent',
  },

  // Print all statements in console
  verbose: true,

  // Ask for confirmation before running dangerous operations
  strict: true,

  // Tables filter (optional - include/exclude specific tables)
  // tablesFilter: ['searches', 'saved_results', 'research_projects'],

  // Schema filter (optional - for multi-schema databases)
  // schemaFilter: ['public'],
});

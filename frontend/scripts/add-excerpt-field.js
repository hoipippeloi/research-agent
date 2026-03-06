import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function addExcerptField() {
  try {
    console.log('Adding excerpt field to saved_results table...');

    await sql`ALTER TABLE saved_results ADD COLUMN IF NOT EXISTS excerpt text;`;

    console.log('✓ Successfully added excerpt field to saved_results table');
  } catch (error) {
    console.error('Error adding excerpt field:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

addExcerptField();

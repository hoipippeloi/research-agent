import postgres from 'postgres';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL or POSTGRES_URL not found in environment');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function migrate() {
  console.log('Running migration...');
  
  try {
    // Add user_email to collections
    const collectionsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'collections' AND column_name = 'user_email'
    `;
    
    if (collectionsCheck.length === 0) {
      console.log('Adding user_email to collections...');
      await sql`ALTER TABLE collections ADD COLUMN user_email TEXT NOT NULL DEFAULT 'placeholder@example.com'`;
      await sql`CREATE INDEX IF NOT EXISTS collections_user_email_idx ON collections(user_email)`;
      console.log('✓ collections updated');
    } else {
      console.log('✓ collections already has user_email');
    }

    // Add user_email to saved_results
    const savedResultsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'saved_results' AND column_name = 'user_email'
    `;
    
    if (savedResultsCheck.length === 0) {
      console.log('Adding user_email to saved_results...');
      await sql`ALTER TABLE saved_results ADD COLUMN user_email TEXT NOT NULL DEFAULT 'placeholder@example.com'`;
      await sql`CREATE INDEX IF NOT EXISTS saved_results_user_email_idx ON saved_results(user_email)`;
      console.log('✓ saved_results updated');
    } else {
      console.log('✓ saved_results already has user_email');
    }

    // Add user_email to research_projects
    const projectsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'research_projects' AND column_name = 'user_email'
    `;
    
    if (projectsCheck.length === 0) {
      console.log('Adding user_email to research_projects...');
      await sql`ALTER TABLE research_projects ADD COLUMN user_email TEXT NOT NULL DEFAULT 'placeholder@example.com'`;
      await sql`CREATE INDEX IF NOT EXISTS research_projects_user_email_idx ON research_projects(user_email)`;
      console.log('✓ research_projects updated');
    } else {
      console.log('✓ research_projects already has user_email');
    }

    // Handle user_preferences - rename user_id to user_email
    const userPrefsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_preferences' AND column_name = 'user_id'
    `;
    
    const userEmailCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_preferences' AND column_name = 'user_email'
    `;

    if (userPrefsCheck.length > 0 && userEmailCheck.length === 0) {
      console.log('Renaming user_id to user_email in user_preferences...');
      await sql`ALTER TABLE user_preferences RENAME COLUMN user_id TO user_email`;
      await sql`ALTER TABLE user_preferences ALTER COLUMN user_email SET NOT NULL`;
      await sql`ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_email_unique UNIQUE (user_email)`;
      await sql`CREATE INDEX IF NOT EXISTS user_preferences_user_email_idx ON user_preferences(user_email)`;
      console.log('✓ user_preferences updated (renamed)');
    } else if (userEmailCheck.length === 0) {
      console.log('Adding user_email to user_preferences...');
      await sql`ALTER TABLE user_preferences ADD COLUMN user_email TEXT NOT NULL DEFAULT 'placeholder@example.com'`;
      await sql`ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_email_unique UNIQUE (user_email)`;
      await sql`CREATE INDEX IF NOT EXISTS user_preferences_user_email_idx ON user_preferences(user_email)`;
      console.log('✓ user_preferences updated (added)');
    } else {
      console.log('✓ user_preferences already has user_email');
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();

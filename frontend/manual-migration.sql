-- Migration: Add userEmail to all tables
-- This migration adds the userEmail column to all user data tables

-- 1. Add user_email to collections table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'user_email') THEN
        ALTER TABLE collections ADD COLUMN user_email TEXT NOT NULL DEFAULT 'placeholder@example.com';
        CREATE INDEX collections_user_email_idx ON collections(user_email);
    END IF;
END $$;

-- 2. Add user_email to searches table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'searches' AND column_name = 'user_email') THEN
        ALTER TABLE searches ADD COLUMN user_email TEXT NOT NULL DEFAULT 'placeholder@example.com';
        CREATE INDEX searches_user_email_idx ON searches(user_email);
    END IF;
END $$;

-- 3. Add user_email to saved_results table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_results' AND column_name = 'user_email') THEN
        ALTER TABLE saved_results ADD COLUMN user_email TEXT NOT NULL DEFAULT 'placeholder@example.com';
        CREATE INDEX saved_results_user_email_idx ON saved_results(user_email);
    END IF;
END $$;

-- 4. Add user_email to research_projects table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_projects' AND column_name = 'user_email') THEN
        ALTER TABLE research_projects ADD COLUMN user_email TEXT NOT NULL DEFAULT 'placeholder@example.com';
        CREATE INDEX research_projects_user_email_idx ON research_projects(user_email);
    END IF;
END $$;

-- 5. Handle user_preferences table - rename user_id to user_email if exists, or add new column
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'user_id') THEN
        -- Rename user_id to user_email
        ALTER TABLE user_preferences RENAME COLUMN user_id TO user_email;
        ALTER TABLE user_preferences ALTER COLUMN user_email SET NOT NULL;
        ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_email_unique UNIQUE (user_email);
        CREATE INDEX user_preferences_user_email_idx ON user_preferences(user_email);
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'user_email') THEN
        -- Add new column
        ALTER TABLE user_preferences ADD COLUMN user_email TEXT NOT NULL DEFAULT 'placeholder@example.com';
        ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_email_unique UNIQUE (user_email);
        CREATE INDEX user_preferences_user_email_idx ON user_preferences(user_email);
    END IF;
END $$;

-- Template categories: Meme, Story only (reels/shorts)
-- Run in Supabase SQL Editor

-- 1. Update existing projects with old template values to 'story'
UPDATE projects
SET template = 'story'
WHERE template NOT IN ('meme', 'story');

-- 2. Drop old check constraint (Postgres stores constraint names; find and drop)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_template_check;

-- 3. Add new check constraint
ALTER TABLE projects
ADD CONSTRAINT projects_template_check CHECK (template IN ('meme', 'story'));

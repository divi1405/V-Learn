BEGIN;

-- 1. DELETE DUMMIES AND ORPHANS
DELETE FROM enrollments WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@company.com' AND email != 'admin@company.com');
DELETE FROM lesson_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@company.com' AND email != 'admin@company.com');
DELETE FROM quiz_attempts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@company.com' AND email != 'admin@company.com');
DELETE FROM certificates WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@company.com' AND email != 'admin@company.com');
DELETE FROM course_reviews WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@company.com' AND email != 'admin@company.com');
DELETE FROM learning_need_analyses WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@company.com' AND email != 'admin@company.com');
DELETE FROM badges WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@company.com' AND email != 'admin@company.com');
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@company.com' AND email != 'admin@company.com');
DELETE FROM user_checkpoint_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@company.com' AND email != 'admin@company.com');
DELETE FROM users WHERE email LIKE '%@company.com' AND email != 'admin@company.com';

-- 2. ADD NEW SCHEMA COLUMNS 
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS division VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS type VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id);

ALTER TABLE users DROP COLUMN IF EXISTS job_title;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;

-- 3. TRANSITION ENUMS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole_old') THEN
        ALTER TYPE userrole RENAME TO userrole_old;
        CREATE TYPE userrole AS ENUM ('ADMIN', 'HR_ADMIN', 'CONTENT_AUTHOR', 'LEARNER', 'MANAGER');
        ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
        ALTER TABLE users ALTER COLUMN role TYPE userrole USING upper(role::text)::userrole;
        ALTER TABLE users ALTER COLUMN role SET DEFAULT 'LEARNER'::userrole;
        DROP TYPE userrole_old;
    END IF;
END $$;

COMMIT;

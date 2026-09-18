-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_supervisor BOOLEAN DEFAULT FALSE
);

-- Ensure is_supervisor column exists (if table already existed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_supervisor') THEN
        ALTER TABLE users ADD COLUMN is_supervisor BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'unconfirmed', -- 'confirmed' or 'unconfirmed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data
-- Password for admin is 'admin' hashed with bcrypt (cost 10)
-- $2b$10$EpOu.fQyr.v.r.v.r.v.re is just a placeholder, let's use a real hash or let the app handle it.
-- For simplicity in this environment, I'll insert a user if not exists.
-- INSERT INTO users (username, password, is_supervisor) 
-- VALUES ('admin', '$2b$10$EpOu.fQyr.v.r.v.r.v.re', TRUE) 
-- ON CONFLICT (username) DO UPDATE SET is_supervisor = TRUE;

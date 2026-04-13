-- Turso SQL Consoleで実行してください
ALTER TABLE bottles ADD COLUMN is_seed INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_bottles_is_seed ON bottles(is_seed);

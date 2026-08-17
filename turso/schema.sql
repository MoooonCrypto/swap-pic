-- BottleSwap / swap-pic
-- Turso/libSQL schema. Image binaries are stored in Cloudflare R2;
-- this database stores matching state and object keys only.

CREATE TABLE IF NOT EXISTS bottles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  country_code TEXT,
  image_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'matched', 'viewed', 'deleted')),
  matched_bottle_id TEXT REFERENCES bottles(id),
  delete_ok INTEGER NOT NULL DEFAULT 0
    CHECK (delete_ok IN (0, 1)),
  delete_ok_at TEXT,
  is_seed INTEGER NOT NULL DEFAULT 0
    CHECK (is_seed IN (0, 1)),
  created_at TEXT NOT NULL,
  matched_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bottles_status ON bottles(status);
CREATE INDEX IF NOT EXISTS idx_bottles_user_id ON bottles(user_id);
CREATE INDEX IF NOT EXISTS idx_bottles_ip_hash ON bottles(ip_hash);
CREATE INDEX IF NOT EXISTS idx_bottles_delete_ok ON bottles(delete_ok);
CREATE INDEX IF NOT EXISTS idx_bottles_is_seed ON bottles(is_seed);
CREATE INDEX IF NOT EXISTS idx_bottles_created_at ON bottles(created_at);

CREATE TABLE IF NOT EXISTS bans (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  user_id TEXT,
  reason TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bans_ip_hash ON bans(ip_hash);
CREATE INDEX IF NOT EXISTS idx_bans_user_id ON bans(user_id);

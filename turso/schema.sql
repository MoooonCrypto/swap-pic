-- Swap Pic: Anonymous Image Exchange Service
-- Schema for Supabase (DB only — images stored in Cloudflare R2)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bottles table
-- image_path: R2 object key (e.g. "{userId}/{uuid}.jpg")
-- delete_ok:  true = 受信者が開封済み → 日次cronで削除対象
CREATE TABLE IF NOT EXISTS bottles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL,
  ip_hash         TEXT        NOT NULL,
  country_code    CHAR(2),
  image_path      TEXT        NOT NULL,           -- R2 key
  status          TEXT        NOT NULL DEFAULT 'waiting'
                    CHECK (status IN ('waiting', 'matched', 'viewed', 'deleted')),
  matched_bottle_id UUID      REFERENCES bottles(id),
  delete_ok       BOOLEAN     NOT NULL DEFAULT FALSE,  -- 削除OKフラグ
  delete_ok_at    TIMESTAMPTZ,                          -- フラグが立った日時（監査用）
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matched_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bottles_status        ON bottles(status);
CREATE INDEX IF NOT EXISTS idx_bottles_user_id       ON bottles(user_id);
CREATE INDEX IF NOT EXISTS idx_bottles_ip_hash       ON bottles(ip_hash);
CREATE INDEX IF NOT EXISTS idx_bottles_delete_ok     ON bottles(delete_ok) WHERE delete_ok = TRUE;

-- Banned IPs / users
CREATE TABLE IF NOT EXISTS bans (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_hash    TEXT        NOT NULL,
  user_id    UUID,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ   -- NULL = 永久BAN
);

CREATE INDEX IF NOT EXISTS idx_bans_ip_hash  ON bans(ip_hash);
CREATE INDEX IF NOT EXISTS idx_bans_user_id  ON bans(user_id);

-- RLS
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans    ENABLE ROW LEVEL SECURITY;

-- サービスロールキーのみフルアクセス（APIルートで使用）
CREATE POLICY "service_all_bottles" ON bottles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_bans"    ON bans    FOR ALL USING (auth.role() = 'service_role');

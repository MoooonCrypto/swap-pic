-- Swap Pic: Anonymous Image Exchange Service
-- Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bottles table: each uploaded image is a "bottle"
CREATE TABLE IF NOT EXISTS bottles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,           -- anonymous user id from localStorage
  ip_hash TEXT NOT NULL,           -- SHA-256 of IP for rate limiting
  country_code CHAR(2),            -- ISO 3166-1 alpha-2 (from IP geolocation)
  image_path TEXT NOT NULL,        -- path in Supabase Storage
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'matched', 'viewed', 'deleted')),
  matched_bottle_id UUID REFERENCES bottles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matched_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes
CREATE INDEX idx_bottles_status ON bottles(status);
CREATE INDEX idx_bottles_user_id ON bottles(user_id);
CREATE INDEX idx_bottles_ip_hash ON bottles(ip_hash);
CREATE INDEX idx_bottles_expires_at ON bottles(expires_at);

-- Banned IPs / users
CREATE TABLE IF NOT EXISTS bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_hash TEXT NOT NULL,
  user_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ  -- NULL means permanent
);

CREATE INDEX idx_bans_ip_hash ON bans(ip_hash);
CREATE INDEX idx_bans_user_id ON bans(user_id);

-- RLS Policies
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by API routes with service key)
CREATE POLICY "service_all_bottles" ON bottles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_all_bans" ON bans
  FOR ALL USING (auth.role() = 'service_role');

-- Storage bucket for bottle images
-- Run this in Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bottle-images', 'bottle-images', false);

-- Storage policy: service role only (no public access)
-- Images are served via signed URLs generated server-side

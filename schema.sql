-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  site TEXT DEFAULT '',
  "group" TEXT NOT NULL DEFAULT 'A' CHECK ("group" IN ('A','B')),
  status TEXT NOT NULL DEFAULT 'unsent' CHECK (status IN ('unsent','sent','replied','interested','not-interested','not-sure')),
  sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  "group" TEXT NOT NULL,
  message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  msg_a TEXT DEFAULT 'Salam {name} 👋',
  msg_b TEXT DEFAULT 'Salam {name} ! 👋',
  wa_url TEXT DEFAULT 'http://136.117.247.136:3001',
  wa_key TEXT DEFAULT 'buildfactory-secret-key',
  send_delay INTEGER DEFAULT 4,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE send_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

GRANT ALL ON leads TO anon, authenticated, service_role;
GRANT ALL ON send_log TO anon, authenticated, service_role;
GRANT ALL ON settings TO anon, authenticated, service_role;

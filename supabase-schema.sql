-- CardAI Creator - Supabase Database Schema
-- Run this in the Supabase SQL Editor to create the necessary tables.

-- Business Cards Table
CREATE TABLE IF NOT EXISTS business_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  bio TEXT,
  avatar TEXT,
  background_image TEXT,
  social_links TEXT DEFAULT '{}',
  show_ai_assistant BOOLEAN DEFAULT TRUE,
  template_id TEXT DEFAULT 'classic',
  html_content TEXT,
  url_hash TEXT UNIQUE NOT NULL,
  user_prompt TEXT,
  create_time TIMESTAMPTZ DEFAULT NOW(),
  update_time TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_cards_url_hash ON business_cards(url_hash);
CREATE INDEX IF NOT EXISTS idx_business_cards_create_time ON business_cards(create_time DESC);

-- Enable Row Level Security (optional, since we're not using auth)
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

-- Allow public access (since we're not using auth)
DROP POLICY IF EXISTS "Allow all access to business_cards" ON business_cards;
CREATE POLICY "Allow all access to business_cards" ON business_cards
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chat History Table (for AI chatbot conversation memory)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_url_hash TEXT NOT NULL REFERENCES business_cards(url_hash) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  create_time TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_card_session ON chat_messages(card_url_hash, session_id, create_time);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to chat_messages" ON chat_messages;
CREATE POLICY "Allow all access to chat_messages" ON chat_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Card Analytics Table (track views)
CREATE TABLE IF NOT EXISTS card_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_url_hash TEXT NOT NULL REFERENCES business_cards(url_hash) ON DELETE CASCADE,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  view_time TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_views_card_hash ON card_views(card_url_hash, view_time DESC);

ALTER TABLE card_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to card_views" ON card_views;
CREATE POLICY "Allow all access to card_views" ON card_views
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update trigger for update_time
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.update_time = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_business_cards_updated_at ON business_cards;
CREATE TRIGGER update_business_cards_updated_at
  BEFORE UPDATE ON business_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
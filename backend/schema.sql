CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username CITEXT UNIQUE NOT NULL,
  email CITEXT UNIQUE,
  name TEXT,
  profile_picture_url TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- pg_cards
CREATE TABLE IF NOT EXISTS pg_cards (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  length INTEGER,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  language TEXT,
  description TEXT,
  subjects TEXT[],
  cover TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  searchable_tsv TSVECTOR
);
CREATE INDEX IF NOT EXISTS pg_cards_search_idx ON pg_cards USING GIN (searchable_tsv);

-- uu_cards
CREATE TABLE IF NOT EXISTS uu_cards (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  length INTEGER,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  language TEXT,
  description TEXT,
  subjects TEXT[],
  cover TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  file_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  searchable_tsv TSVECTOR
);
CREATE INDEX IF NOT EXISTS uu_cards_search_idx ON uu_cards USING GIN (searchable_tsv);

-- Uploads
CREATE TABLE IF NOT EXISTS uploads (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  upload_id TEXT NOT NULL REFERENCES uu_cards(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, upload_id)
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_collection_name_unique UNIQUE (user_id, name)
);
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);

-- Books in collections
CREATE TABLE IF NOT EXISTS user_collections_books (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  booq_id TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (collection_id, booq_id)
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booq_id TEXT NOT NULL,
  path SMALLINT[] NOT NULL,
  CONSTRAINT unique_user_booq_path UNIQUE (user_id, booq_id, path)
);
CREATE INDEX IF NOT EXISTS bookmarks_user_booq_idx ON bookmarks(user_id, booq_id);
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks(user_id);

-- Highlights
CREATE TABLE IF NOT EXISTS highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  booq_id TEXT NOT NULL,
  start_path INTEGER[] NOT NULL,
  end_path INTEGER[] NOT NULL,
  color TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS highlights_user_id_idx ON highlights(user_id);
CREATE INDEX IF NOT EXISTS highlights_booq_id_idx ON highlights(booq_id);

-- Passkey credentials
CREATE TABLE IF NOT EXISTS passkey_credentials (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT[],
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Full-text search helper functions
CREATE OR REPLACE FUNCTION jsonb_to_text(jsonb) RETURNS TEXT AS $$
  SELECT string_agg(value::text, ' ') FROM jsonb_each_text($1)
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION greatest_similarity(arr TEXT[], query TEXT) RETURNS FLOAT AS $$
  SELECT MAX(similarity(el, query)) FROM unnest(arr) el
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION exists_similarity(arr TEXT[], query TEXT) RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM unnest(arr) el WHERE el % query)
$$ LANGUAGE SQL IMMUTABLE;

-- FTS triggers for pg_cards (with 'english' config)
CREATE OR REPLACE FUNCTION update_pg_cards_search_tsv() RETURNS trigger AS $$
BEGIN
  NEW.searchable_tsv :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', array_to_string(NEW.authors, ' ')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(NEW.subjects, ' ')), 'D') ||
    setweight(to_tsvector('english', coalesce(jsonb_to_text(NEW.metadata), '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER pg_cards_search_trigger
  BEFORE INSERT OR UPDATE ON pg_cards
  FOR EACH ROW EXECUTE FUNCTION update_pg_cards_search_tsv();
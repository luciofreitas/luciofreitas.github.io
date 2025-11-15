-- Migration: 0001-add-photo_url.sql
-- Purpose: add photo_url column to users table to store avatar image URLs
-- Run this on your Postgres database used by the backend.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Optional: create an index if you plan to query by photo_url (not required)
-- CREATE INDEX IF NOT EXISTS idx_users_photo_url ON users (photo_url);

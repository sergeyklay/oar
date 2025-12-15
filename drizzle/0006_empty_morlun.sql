-- Migration 0006: No-op migration
-- The amount_due column default was already set in migration 0005
-- SQLite does not support altering column defaults, so this migration is empty
-- This statement ensures the migration file is valid
SELECT 1;


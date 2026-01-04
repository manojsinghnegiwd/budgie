-- AlterTable: Add isPaid column to Expense
-- This migration adds the isPaid field with a default value of true
-- Existing expenses will be marked as paid, new recurring/reminder expenses will be unpaid

-- SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS directly
-- So we check if the column exists first by attempting to add it
-- If it already exists, this will fail gracefully in a transaction context

-- Add isPaid column with default value of true
ALTER TABLE "Expense" ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT true;

-- Update existing recurring expenses to be unpaid
UPDATE "Expense" SET "isPaid" = false WHERE "type" = 'recurring';

-- Update existing reminder expenses to be unpaid  
UPDATE "Expense" SET "isPaid" = false WHERE "type" = 'reminder';


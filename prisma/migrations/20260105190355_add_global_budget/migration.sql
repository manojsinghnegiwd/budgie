-- CreateTable: Add GlobalBudget table for shared global budget
-- This replaces per-user budgets with a single global budget shared across all users

-- Create GlobalBudget table
CREATE TABLE "GlobalBudget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monthlyLimit" REAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex: Add unique constraint on month and year
CREATE UNIQUE INDEX "GlobalBudget_month_year_key" ON "GlobalBudget"("month", "year");

-- CreateIndex: Add index on year and month for efficient queries
CREATE INDEX "GlobalBudget_year_month_idx" ON "GlobalBudget"("year", "month");

-- AlterTable: Add defaultGlobalBudgetLimit column to Settings
-- This stores the default global budget limit when no monthly record exists
ALTER TABLE "Settings" ADD COLUMN "defaultGlobalBudgetLimit" REAL NOT NULL DEFAULT 0;

-- Data Migration: Set defaultGlobalBudgetLimit to 0 for existing Settings records
-- This ensures existing records have a valid default value
UPDATE "Settings" SET "defaultGlobalBudgetLimit" = 0 WHERE "defaultGlobalBudgetLimit" IS NULL;

-- Data Migration: Migrate existing Budget records to GlobalBudget for current month
-- This preserves existing budget data by creating GlobalBudget records from existing Budget records
-- For the current month, we'll use the sum of all user budgets as the global budget
-- If multiple users have budgets for the same month, we sum them to preserve the total
INSERT INTO "GlobalBudget" (
    "id",
    "monthlyLimit",
    "month",
    "year",
    "createdAt",
    "updatedAt"
)
SELECT 
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', (abs(random()) % 4) + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))) as "id",
    SUM("monthlyLimit") as "monthlyLimit",
    "month",
    "year",
    MIN("createdAt") as "createdAt",
    MAX("updatedAt") as "updatedAt"
FROM "Budget"
WHERE NOT EXISTS (
    SELECT 1 FROM "GlobalBudget" 
    WHERE "GlobalBudget"."month" = "Budget"."month" 
    AND "GlobalBudget"."year" = "Budget"."year"
)
GROUP BY "month", "year"
HAVING SUM("monthlyLimit") > 0;

-- Note: The old Budget table is kept for historical data preservation
-- All existing Budget records remain intact and are not deleted


-- CreateTable: UserCategoryDefaultBudget
-- This table stores per-user, per-category default budget limits (used for future months)
CREATE TABLE "UserCategoryDefaultBudget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCategoryDefaultBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCategoryDefaultBudget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Data Migration: Migrate existing UserCategoryBudget records to UserCategoryDefaultBudget
-- This preserves the existing budget limits as defaults
INSERT INTO "UserCategoryDefaultBudget" (
    "id",
    "userId",
    "categoryId",
    "limit",
    "createdAt",
    "updatedAt"
)
SELECT 
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', (abs(random()) % 4) + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))) as "id",
    "userId",
    "categoryId",
    "limit",
    "createdAt",
    "updatedAt"
FROM "UserCategoryBudget";

-- AlterTable: Add month and year columns to UserCategoryBudget
-- These columns will track which month/year each budget record is for
ALTER TABLE "UserCategoryBudget" ADD COLUMN "month" INTEGER;
ALTER TABLE "UserCategoryBudget" ADD COLUMN "year" INTEGER;

-- Data Migration: Set current month/year for existing UserCategoryBudget records
-- This converts existing records into monthly records for the current month
UPDATE "UserCategoryBudget" 
SET 
    "month" = CAST(strftime('%m', 'now') AS INTEGER),
    "year" = CAST(strftime('%Y', 'now') AS INTEGER)
WHERE "month" IS NULL OR "year" IS NULL;

-- Make month and year NOT NULL after setting values
-- SQLite doesn't support ALTER COLUMN, so we'll ensure all existing records have values
-- The Prisma schema will handle NOT NULL constraint for new records

-- DropIndex: Remove old unique constraint
DROP INDEX IF EXISTS "UserCategoryBudget_userId_categoryId_key";

-- CreateUniqueIndex: New unique constraint with month and year
CREATE UNIQUE INDEX "UserCategoryBudget_userId_categoryId_month_year_key" ON "UserCategoryBudget"("userId", "categoryId", "month", "year");

-- CreateIndex: New index for efficient month/year lookups
CREATE INDEX "UserCategoryBudget_userId_categoryId_year_month_idx" ON "UserCategoryBudget"("userId", "categoryId", "year", "month");

-- CreateIndex: Indexes for UserCategoryDefaultBudget
CREATE INDEX "UserCategoryDefaultBudget_userId_idx" ON "UserCategoryDefaultBudget"("userId");
CREATE INDEX "UserCategoryDefaultBudget_categoryId_idx" ON "UserCategoryDefaultBudget"("categoryId");

-- CreateUniqueIndex: Unique constraint for UserCategoryDefaultBudget
CREATE UNIQUE INDEX "UserCategoryDefaultBudget_userId_categoryId_key" ON "UserCategoryDefaultBudget"("userId", "categoryId");


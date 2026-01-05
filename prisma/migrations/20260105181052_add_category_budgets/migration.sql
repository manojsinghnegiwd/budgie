-- AlterTable: Add budgetLimit and isGlobalLimit columns to Category
-- This migration adds budget tracking fields to categories
-- Existing categories will have NULL budgetLimit and isGlobalLimit = true

-- Add budgetLimit column (nullable)
ALTER TABLE "Category" ADD COLUMN "budgetLimit" REAL;

-- Add isGlobalLimit column with default value of true
ALTER TABLE "Category" ADD COLUMN "isGlobalLimit" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: UserCategoryBudget
-- This table stores per-user budget limits for categories when isGlobalLimit is false
CREATE TABLE "UserCategoryBudget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCategoryBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCategoryBudget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex: userId index for UserCategoryBudget
CREATE INDEX "UserCategoryBudget_userId_idx" ON "UserCategoryBudget"("userId");

-- CreateIndex: categoryId index for UserCategoryBudget
CREATE INDEX "UserCategoryBudget_categoryId_idx" ON "UserCategoryBudget"("categoryId");

-- CreateUniqueIndex: userId_categoryId unique constraint
CREATE UNIQUE INDEX "UserCategoryBudget_userId_categoryId_key" ON "UserCategoryBudget"("userId", "categoryId");


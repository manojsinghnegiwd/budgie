-- Migration: Remove isGlobalLimit and use isShared for budget behavior
-- isShared=true: Uses Category.budgetLimit (global budget for all users)
-- isShared=false: Uses UserCategoryBudget (per-user personal budgets)

-- Step 1: Update isShared based on isGlobalLimit (derive from isGlobalLimit)
-- Categories with isGlobalLimit=true should be shared
UPDATE "Category" SET "isShared" = 1 WHERE "isGlobalLimit" = 1;
UPDATE "Category" SET "isShared" = 0 WHERE "isGlobalLimit" = 0;

-- Step 2: Drop the isGlobalLimit column
ALTER TABLE "Category" DROP COLUMN "isGlobalLimit";


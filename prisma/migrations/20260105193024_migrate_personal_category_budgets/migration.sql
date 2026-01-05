-- Migrate personal category budgets from Category to UserCategoryBudget
-- For categories where isGlobalLimit=false and budgetLimit is set

-- Insert into UserCategoryDefaultBudget (for future months)
INSERT INTO "UserCategoryDefaultBudget" ("id", "userId", "categoryId", "limit", "createdAt", "updatedAt")
SELECT 
  lower(hex(randomblob(12))),
  (SELECT "id" FROM "User" WHERE LOWER("name") = 'manoj' LIMIT 1),
  "id",
  "budgetLimit",
  datetime('now'),
  datetime('now')
FROM "Category"
WHERE "isGlobalLimit" = 0 AND "budgetLimit" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "UserCategoryDefaultBudget" ucdb 
  WHERE ucdb."categoryId" = "Category"."id" 
  AND ucdb."userId" = (SELECT "id" FROM "User" WHERE LOWER("name") = 'manoj' LIMIT 1)
);

-- Insert into UserCategoryBudget (for current month)
INSERT INTO "UserCategoryBudget" ("id", "userId", "categoryId", "limit", "month", "year", "createdAt", "updatedAt")
SELECT 
  lower(hex(randomblob(12))),
  (SELECT "id" FROM "User" WHERE LOWER("name") = 'manoj' LIMIT 1),
  "id",
  "budgetLimit",
  CAST(strftime('%m', 'now') AS INTEGER),
  CAST(strftime('%Y', 'now') AS INTEGER),
  datetime('now'),
  datetime('now')
FROM "Category"
WHERE "isGlobalLimit" = 0 AND "budgetLimit" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "UserCategoryBudget" ucb 
  WHERE ucb."categoryId" = "Category"."id" 
  AND ucb."userId" = (SELECT "id" FROM "User" WHERE LOWER("name") = 'manoj' LIMIT 1)
  AND ucb."month" = CAST(strftime('%m', 'now') AS INTEGER)
  AND ucb."year" = CAST(strftime('%Y', 'now') AS INTEGER)
);

-- Clear budgetLimit on categories where isGlobalLimit is false
UPDATE "Category" SET "budgetLimit" = NULL WHERE "isGlobalLimit" = 0;


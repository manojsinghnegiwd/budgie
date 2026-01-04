-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'regular',
    "isProjected" BOOLEAN NOT NULL DEFAULT false,
    "recurringFrequency" TEXT,
    "dayOfMonth" INTEGER,
    "nextDueDate" DATETIME,
    "endDate" DATETIME,
    "isActive" BOOLEAN,
    "isCompleted" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("amount", "categoryId", "createdAt", "date", "dayOfMonth", "description", "id", "isActive", "isCompleted", "isProjected", "nextDueDate", "recurringFrequency", "type", "updatedAt", "userId") SELECT "amount", "categoryId", "createdAt", "date", "dayOfMonth", "description", "id", "isActive", "isCompleted", coalesce("isProjected", false) AS "isProjected", "nextDueDate", "recurringFrequency", coalesce("type", 'regular') AS "type", "updatedAt", "userId" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE INDEX "Expense_userId_date_idx" ON "Expense"("userId", "date");
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");
CREATE INDEX "Expense_type_idx" ON "Expense"("type");
CREATE INDEX "Expense_isProjected_idx" ON "Expense"("isProjected");
CREATE INDEX "Expense_nextDueDate_idx" ON "Expense"("nextDueDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

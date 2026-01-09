CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "defaultBudgetLimit" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "monthlyLimit" REAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "budgetLimit" REAL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "additionalDescription" TEXT,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'regular',
    "isProjected" BOOLEAN NOT NULL DEFAULT false,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
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

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usdConversionRate" REAL NOT NULL DEFAULT 83.0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "defaultGlobalBudgetLimit" REAL NOT NULL DEFAULT 0,
    "enableBudgetCarryover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "UserCategoryBudget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCategoryBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCategoryBudget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlobalBudget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monthlyLimit" REAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InsightCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewUserId" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "insightType" TEXT NOT NULL,
    "insightData" TEXT NOT NULL,
    "insightText" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE INDEX "Budget_userId_year_month_idx" ON "Budget"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_month_year_key" ON "Budget"("userId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Expense_userId_date_idx" ON "Expense"("userId", "date");

-- CreateIndex
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");

-- CreateIndex
CREATE INDEX "Expense_categoryId_date_idx" ON "Expense"("categoryId", "date");

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "Expense_type_idx" ON "Expense"("type");

-- CreateIndex
CREATE INDEX "Expense_isProjected_idx" ON "Expense"("isProjected");

-- CreateIndex
CREATE INDEX "Expense_nextDueDate_idx" ON "Expense"("nextDueDate");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "UserCategoryDefaultBudget_userId_idx" ON "UserCategoryDefaultBudget"("userId");

-- CreateIndex
CREATE INDEX "UserCategoryDefaultBudget_categoryId_idx" ON "UserCategoryDefaultBudget"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCategoryDefaultBudget_userId_categoryId_key" ON "UserCategoryDefaultBudget"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "UserCategoryBudget_userId_idx" ON "UserCategoryBudget"("userId");

-- CreateIndex
CREATE INDEX "UserCategoryBudget_categoryId_idx" ON "UserCategoryBudget"("categoryId");

-- CreateIndex
CREATE INDEX "UserCategoryBudget_userId_categoryId_year_month_idx" ON "UserCategoryBudget"("userId", "categoryId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "UserCategoryBudget_userId_categoryId_month_year_key" ON "UserCategoryBudget"("userId", "categoryId", "month", "year");

-- CreateIndex
CREATE INDEX "GlobalBudget_year_month_idx" ON "GlobalBudget"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalBudget_month_year_key" ON "GlobalBudget"("month", "year");

-- CreateIndex
CREATE INDEX "InsightCache_viewUserId_month_year_idx" ON "InsightCache"("viewUserId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "InsightCache_viewUserId_month_year_insightType_key" ON "InsightCache"("viewUserId", "month", "year", "insightType");


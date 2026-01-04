-- AlterTable: Add new columns to Expense
ALTER TABLE "Expense" ADD COLUMN "type" TEXT;
ALTER TABLE "Expense" ADD COLUMN "isProjected" BOOLEAN;
ALTER TABLE "Expense" ADD COLUMN "recurringFrequency" TEXT;
ALTER TABLE "Expense" ADD COLUMN "dayOfMonth" INTEGER;
ALTER TABLE "Expense" ADD COLUMN "nextDueDate" DATETIME;
ALTER TABLE "Expense" ADD COLUMN "isActive" BOOLEAN;
ALTER TABLE "Expense" ADD COLUMN "isCompleted" BOOLEAN;

-- Set defaults for existing expenses
UPDATE "Expense" SET "type" = 'regular' WHERE "type" IS NULL;
UPDATE "Expense" SET "isProjected" = false WHERE "isProjected" IS NULL;

-- Data Migration: Migrate RecurringBill data to Expense
INSERT INTO "Expense" (
  "id",
  "userId",
  "description",
  "amount",
  "date",
  "categoryId",
  "type",
  "isProjected",
  "recurringFrequency",
  "dayOfMonth",
  "nextDueDate",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT 
  "id",
  "userId",
  "title" as "description",
  "amount",
  "nextDueDate" as "date",
  "categoryId",
  'recurring' as "type",
  true as "isProjected",
  "frequency" as "recurringFrequency",
  "dayOfMonth",
  "nextDueDate",
  "isActive",
  "createdAt",
  "updatedAt"
FROM "RecurringBill";

-- Data Migration: Migrate Reminder data to Expense
INSERT INTO "Expense" (
  "id",
  "userId",
  "description",
  "amount",
  "date",
  "categoryId",
  "type",
  "isProjected",
  "isCompleted",
  "createdAt",
  "updatedAt"
)
SELECT 
  "id",
  "userId",
  "title" as "description",
  "estimatedAmount" as "amount",
  "dueDate" as "date",
  "categoryId",
  'reminder' as "type",
  CASE WHEN "isCompleted" = 0 THEN true ELSE false END as "isProjected",
  "isCompleted",
  "createdAt",
  "updatedAt"
FROM "Reminder";

-- DropTable: Remove old tables
DROP TABLE "RecurringBill";
DROP TABLE "Reminder";

-- CreateIndex
CREATE INDEX "Expense_type_idx" ON "Expense"("type");
CREATE INDEX "Expense_isProjected_idx" ON "Expense"("isProjected");
CREATE INDEX "Expense_nextDueDate_idx" ON "Expense"("nextDueDate");


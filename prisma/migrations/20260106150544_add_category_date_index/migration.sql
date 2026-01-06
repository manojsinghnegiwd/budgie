-- CreateIndex: Add composite index on categoryId and date for faster filtered queries
CREATE INDEX "Expense_categoryId_date_idx" ON "Expense"("categoryId", "date");


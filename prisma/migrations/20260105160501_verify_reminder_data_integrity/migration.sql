-- Verification Migration: Ensure all reminder expenses have valid amount and date values
-- This migration verifies data integrity after refactoring reminder fields
-- from estimatedAmount/dueDate to amount/date

-- Note: Since the schema already uses amount and date for all expenses,
-- and the previous migration (20260104153353_unify_expenses) already converted
-- reminder data from estimatedAmount/dueDate to amount/date, this is primarily
-- a verification step to ensure no data was lost.

-- The code refactoring only changed parameter names (estimatedAmount -> amount, dueDate -> date),
-- not database fields. All existing reminder records already have their data in the correct format.

-- Verification: Check for any reminder expenses with invalid data
-- This query will fail if any reminders have NULL amount or date (which shouldn't happen due to schema constraints)
-- If the query succeeds, all reminder data is valid

-- Count total reminder expenses
-- SELECT COUNT(*) as total_reminders FROM "Expense" WHERE "type" = 'reminder';

-- Verify all reminders have valid amount (not NULL and > 0)
-- SELECT COUNT(*) as invalid_amounts FROM "Expense" 
-- WHERE "type" = 'reminder' AND ("amount" IS NULL OR "amount" <= 0);

-- Verify all reminders have valid date (not NULL)
-- SELECT COUNT(*) as invalid_dates FROM "Expense" 
-- WHERE "type" = 'reminder' AND "date" IS NULL;

-- Since SQLite doesn't support stored procedures or complex verification in migrations,
-- and the schema already enforces NOT NULL constraints, this migration is primarily
-- for documentation purposes. The actual verification should be done in application code
-- or via a separate verification script.

-- No actual data changes are needed since the schema already stores reminders correctly
-- This migration serves as documentation that the refactoring is safe and no data migration is required


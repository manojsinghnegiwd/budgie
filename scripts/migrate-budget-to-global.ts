/**
 * Data Migration Script: Migrate existing Budget records to GlobalBudget
 * 
 * This script preserves existing budget data by:
 * 1. Creating GlobalBudget records from existing Budget records
 * 2. Summing budgets for the same month/year across all users
 * 3. Preserving all existing Budget records (they remain for historical data)
 * 
 * Run this after the schema migration to ensure no data loss.
 */

import { config } from "dotenv";
import { createClient } from "@libsql/client";

// Load environment variables
config();

async function migrateBudgetToGlobal() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("❌ DATABASE_URL and TURSO_AUTH_TOKEN must be set");
    process.exit(1);
  }

  const client = createClient({
    url,
    authToken,
  });

  console.log("🔄 Migrating existing Budget records to GlobalBudget...\n");

  try {
    // Check if GlobalBudget table exists
    const tableCheck = await client.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='GlobalBudget'`,
    });

    if (tableCheck.rows.length === 0) {
      console.error("❌ GlobalBudget table does not exist. Please run schema migration first.");
      process.exit(1);
    }

    // Get all existing Budget records grouped by month/year
    const budgetsResult = await client.execute({
      sql: `
        SELECT 
          month,
          year,
          SUM(monthlyLimit) as totalLimit,
          MIN(createdAt) as createdAt,
          MAX(updatedAt) as updatedAt
        FROM Budget
        GROUP BY month, year
        HAVING SUM(monthlyLimit) > 0
      `,
    });

    console.log(`   Found ${budgetsResult.rows.length} unique month/year combinations with budgets\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const row of budgetsResult.rows) {
      const month = row.month as number;
      const year = row.year as number;
      const totalLimit = row.totalLimit as number;
      const createdAt = row.createdAt as string;
      const updatedAt = row.updatedAt as string;

      // Check if GlobalBudget already exists for this month/year
      const existingCheck = await client.execute({
        sql: `SELECT id FROM GlobalBudget WHERE month = ? AND year = ?`,
        args: [month, year],
      });

      if (existingCheck.rows.length > 0) {
        console.log(`   ⏭️  Skipping ${month}/${year} - GlobalBudget already exists`);
        skippedCount++;
        continue;
      }

      // Generate a CUID-like ID
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Insert into GlobalBudget
      await client.execute({
        sql: `
          INSERT INTO GlobalBudget (id, monthlyLimit, month, year, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [id, totalLimit, month, year, createdAt, updatedAt],
      });

      console.log(`   ✓ Migrated ${month}/${year}: ₹${totalLimit} (sum of all user budgets)`);
      migratedCount++;
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migratedCount} month/year combinations`);
    console.log(`   Skipped: ${skippedCount} (already exist)`);
    console.log(`\n📝 Note: All existing Budget records are preserved for historical data.`);
  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  }
}

migrateBudgetToGlobal();


/**
 * Verification script to ensure no data was lost during the reminder field refactoring.
 * This script verifies that all reminder expenses have valid amount and date values.
 * 
 * Run with: npx tsx scripts/verify-reminder-data.ts
 */

import { prisma } from "../lib/prisma";

async function verifyReminderData() {
  console.log("🔍 Verifying reminder expense data integrity...\n");

  try {
    // Get all reminder expenses
    const reminders = await prisma.expense.findMany({
      where: {
        type: "reminder",
      },
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        userId: true,
      },
    });

    console.log(`📊 Total reminder expenses found: ${reminders.length}\n`);

    if (reminders.length === 0) {
      console.log("✅ No reminder expenses to verify.");
      return;
    }

    // Check for invalid data
    const invalidAmounts = reminders.filter(
      (r) => r.amount === null || r.amount === undefined || r.amount <= 0
    );
    const invalidDates = reminders.filter(
      (r) => r.date === null || r.date === undefined
    );

    // Report results
    if (invalidAmounts.length > 0) {
      console.error(`❌ Found ${invalidAmounts.length} reminders with invalid amounts:`);
      invalidAmounts.forEach((r) => {
        console.error(`   - ID: ${r.id}, Description: ${r.description}, Amount: ${r.amount}`);
      });
      console.error("");
    } else {
      console.log("✅ All reminders have valid amounts (not null and > 0)");
    }

    if (invalidDates.length > 0) {
      console.error(`❌ Found ${invalidDates.length} reminders with invalid dates:`);
      invalidDates.forEach((r) => {
        console.error(`   - ID: ${r.id}, Description: ${r.description}, Date: ${r.date}`);
      });
      console.error("");
    } else {
      console.log("✅ All reminders have valid dates (not null)");
    }

    // Summary
    if (invalidAmounts.length === 0 && invalidDates.length === 0) {
      console.log("\n✅ All reminder data is valid! No data loss detected.");
      console.log("\n📝 Summary:");
      console.log(`   - Total reminders: ${reminders.length}`);
      console.log(`   - Valid amounts: ${reminders.length - invalidAmounts.length}`);
      console.log(`   - Valid dates: ${reminders.length - invalidDates.length}`);
    } else {
      console.error("\n❌ Data integrity check failed!");
      console.error(`   - Invalid amounts: ${invalidAmounts.length}`);
      console.error(`   - Invalid dates: ${invalidDates.length}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error verifying reminder data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyReminderData();



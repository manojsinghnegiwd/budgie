// Load environment variables FIRST before any imports that depend on them
import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "../lib/prisma";
import { ensureIndexExists } from "../lib/pinecone";
import { batchUpsertExpenseEmbeddings } from "../lib/embeddings";

async function backfillEmbeddings() {
  console.log("Starting embedding backfill process...\n");

  try {
    // Ensure Pinecone index exists
    console.log("Checking Pinecone index...");
    await ensureIndexExists();
    console.log("✓ Pinecone index is ready\n");

    // Get total count
    const totalCount = await prisma.expense.count();
    console.log(`Found ${totalCount} expenses to process\n`);

    if (totalCount === 0) {
      console.log("No expenses to process. Exiting.");
      return;
    }

    // Process in batches
    const batchSize = 100;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    console.log("Processing expenses in batches...\n");

    while (processed < totalCount) {
      try {
        // Fetch batch
        const expenses = await prisma.expense.findMany({
          select: {
            id: true,
            description: true,
            additionalDescription: true,
            userId: true,
            categoryId: true,
            date: true,
            amount: true,
          },
          skip: processed,
          take: batchSize,
        });

        if (expenses.length === 0) break;

        // Process batch
        await batchUpsertExpenseEmbeddings(expenses);
        
        succeeded += expenses.length;
        processed += expenses.length;

        const progress = Math.round((processed / totalCount) * 100);
        console.log(
          `✓ Processed ${processed}/${totalCount} expenses (${progress}%)`
        );
      } catch (error) {
        console.error(`✗ Error processing batch at offset ${processed}:`, error);
        failed += Math.min(batchSize, totalCount - processed);
        processed += batchSize;
      }
    }

    console.log("\n" + "─".repeat(50));
    console.log("✅ Backfill complete!");
    console.log(`   Succeeded: ${succeeded}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${totalCount}`);
    console.log("─".repeat(50) + "\n");

    if (failed > 0) {
      console.log("⚠️  Some expenses failed to process. Check logs above for details.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Fatal error during backfill:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillEmbeddings().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});


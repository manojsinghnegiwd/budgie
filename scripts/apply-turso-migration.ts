import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ quiet: true });

async function applyMigration() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log("Connecting to Turso database...");
  console.log("URL:", process.env.DATABASE_URL);

  // Read the migration SQL file
  const migrationPath = join(
    __dirname,
    "..",
    "prisma",
    "migrations",
    "20260109000000_add_enable_budget_carryover",
    "migration.sql"
  );
  const migrationSql = readFileSync(migrationPath, "utf-8");

  // Remove comment lines and split by semicolon
  const cleanedSql = migrationSql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  // Split into individual statements
  const statements = cleanedSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.replace(/\s+/g, " ").substring(0, 80);
    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      await client.execute(statement);
      console.log("   ✓ Success\n");
      successCount++;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // Ignore "already exists" or "duplicate" errors
      if (
        errorMessage.includes("already exists") ||
        errorMessage.includes("duplicate") ||
        errorMessage.includes("UNIQUE constraint")
      ) {
        console.log("   ⚠ Already exists, skipping\n");
        skipCount++;
      } else {
        console.error("   ✗ Error:", errorMessage, "\n");
        throw error; // Re-throw to stop execution on real errors
      }
    }
  }

  console.log("─".repeat(50));
  console.log(`✅ Migration applied to Turso database!`);
  console.log(`   Applied: ${successCount} | Skipped: ${skipCount}`);
  client.close();
}

applyMigration().catch(console.error);


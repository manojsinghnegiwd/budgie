import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
config({ quiet: true });

async function applySchema() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log("Connecting to Turso database...");
  console.log("URL:", process.env.DATABASE_URL);

  // Read the schema SQL file
  const schemaPath = join(__dirname, "..", "turso-schema.sql");
  const schemaSql = readFileSync(schemaPath, "utf-8");

  // Remove comment lines and split by semicolon
  const cleanedSql = schemaSql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  // Split into individual statements
  const statements = cleanedSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      const preview = statement.replace(/\s+/g, " ").substring(0, 60);
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);
      await client.execute(statement);
      console.log("   ✓ Success\n");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // Ignore "table already exists" errors
      if (errorMessage.includes("already exists")) {
        console.log("   ⚠ Already exists, skipping\n");
      } else {
        console.error("   ✗ Error:", errorMessage, "\n");
      }
    }
  }

  console.log("✅ Schema applied to Turso database!");
  client.close();
}

applySchema().catch(console.error);


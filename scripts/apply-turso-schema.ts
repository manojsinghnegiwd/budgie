import { createClient, Client } from "@libsql/client";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
config({ quiet: true });

interface ColumnDef {
  name: string;
  definition: string;
}

interface TableDef {
  name: string;
  columns: ColumnDef[];
  fullStatement: string;
}

// Parse a CREATE TABLE statement to extract table name and columns
function parseCreateTable(statement: string): TableDef | null {
  const tableMatch = statement.match(
    /CREATE TABLE\s+"?(\w+)"?\s*\(([\s\S]+)\)/i
  );
  if (!tableMatch) return null;

  const tableName = tableMatch[1];
  const columnsSection = tableMatch[2];

  // Split by commas, but be careful with CONSTRAINT clauses
  const parts = columnsSection.split(",").map((p) => p.trim());
  const columns: ColumnDef[] = [];

  let currentColumn = "";
  for (const part of parts) {
    currentColumn += (currentColumn ? ", " : "") + part;

    // Check if this is a complete column definition or constraint
    const isConstraint =
      currentColumn.trim().toUpperCase().startsWith("CONSTRAINT") ||
      currentColumn.trim().toUpperCase().startsWith("FOREIGN KEY") ||
      currentColumn.trim().toUpperCase().startsWith("PRIMARY KEY") ||
      currentColumn.trim().toUpperCase().startsWith("UNIQUE") ||
      currentColumn.trim().toUpperCase().startsWith("CHECK");

    // Count parentheses to handle nested expressions
    const openParens = (currentColumn.match(/\(/g) || []).length;
    const closeParens = (currentColumn.match(/\)/g) || []).length;

    if (openParens === closeParens) {
      if (!isConstraint) {
        // Extract column name (first word, possibly quoted)
        const colMatch = currentColumn.trim().match(/^"?(\w+)"?\s+(.+)/);
        if (colMatch) {
          columns.push({
            name: colMatch[1],
            definition: currentColumn.trim(),
          });
        }
      }
      currentColumn = "";
    }
  }

  return { name: tableName, columns, fullStatement: statement };
}

// Get existing columns for a table from Turso
async function getExistingColumns(
  client: Client,
  tableName: string
): Promise<string[]> {
  try {
    const result = await client.execute(`PRAGMA table_info("${tableName}")`);
    return result.rows.map((row) => row.name as string);
  } catch {
    return [];
  }
}

// Check if a table exists
async function tableExists(client: Client, tableName: string): Promise<boolean> {
  try {
    const result = await client.execute(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

// Generate ALTER TABLE ADD COLUMN statement
function generateAlterColumn(tableName: string, columnDef: string): string {
  return `ALTER TABLE "${tableName}" ADD COLUMN ${columnDef}`;
}

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

  let successCount = 0;
  let skipCount = 0;
  let alterCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.replace(/\s+/g, " ").substring(0, 60);
    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    // Check if this is a CREATE TABLE statement
    if (statement.toUpperCase().includes("CREATE TABLE")) {
      const tableDef = parseCreateTable(statement);

      if (tableDef) {
        const exists = await tableExists(client, tableDef.name);

        if (exists) {
          // Table exists - check for missing columns
          const existingColumns = await getExistingColumns(client, tableDef.name);
          const missingColumns = tableDef.columns.filter(
            (col) =>
              !existingColumns
                .map((c) => c.toLowerCase())
                .includes(col.name.toLowerCase())
          );

          if (missingColumns.length > 0) {
            console.log(
              `   ⚠ Table exists, adding ${missingColumns.length} missing column(s)...`
            );

            for (const col of missingColumns) {
              try {
                const alterSql = generateAlterColumn(tableDef.name, col.definition);
                await client.execute(alterSql);
                console.log(`   ✓ Added column: ${col.name}`);
                alterCount++;
              } catch (error: unknown) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                console.error(`   ✗ Error adding ${col.name}: ${errorMessage}`);
              }
            }
            console.log("");
          } else {
            console.log("   ⚠ Table exists with all columns, skipping\n");
            skipCount++;
          }
          continue;
        }
      }
    }

    // Execute the statement normally
    try {
      await client.execute(statement);
      console.log("   ✓ Success\n");
      successCount++;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // Ignore "already exists" errors
      if (errorMessage.includes("already exists")) {
        console.log("   ⚠ Already exists, skipping\n");
        skipCount++;
      } else {
        console.error("   ✗ Error:", errorMessage, "\n");
      }
    }
  }

  console.log("─".repeat(50));
  console.log(`✅ Schema applied to Turso database!`);
  console.log(`   Created: ${successCount} | Altered: ${alterCount} | Skipped: ${skipCount}`);
  client.close();
}

applySchema().catch(console.error);

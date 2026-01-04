import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { join } from "path";

// Load environment variables
config({ quiet: true });

interface User {
  id: string;
  name: string;
  avatar: string | null;
  defaultBudgetLimit: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Budget {
  id: string;
  userId: string;
  monthlyLimit: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  type: string;
  isProjected: number;
  isPaid: number;
  recurringFrequency: string | null;
  dayOfMonth: number | null;
  nextDueDate: string | null;
  endDate: string | null;
  isActive: number | null;
  isCompleted: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Settings {
  id: string;
  usdConversionRate: number;
  createdAt: string;
  updatedAt: string;
}

async function migrateToTurso() {
  // Connect to local SQLite file
  const localDbPath = join(__dirname, "..", "prisma", "dev.db");
  const localClient = createClient({
    url: `file:${localDbPath}`,
  });

  // Connect to Turso
  const tursoClient = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log("📂 Reading from local database:", localDbPath);
  console.log("☁️  Writing to Turso:", process.env.DATABASE_URL);
  console.log("");

  try {
    // ===== USERS =====
    console.log("👤 Migrating Users...");
    const usersResult = await localClient.execute("SELECT * FROM User");
    const users = usersResult.rows as unknown as User[];
    console.log(`   Found ${users.length} users`);

    for (const user of users) {
      try {
        await tursoClient.execute({
          sql: `INSERT OR REPLACE INTO User (id, name, avatar, defaultBudgetLimit, createdAt, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            user.id,
            user.name,
            user.avatar,
            user.defaultBudgetLimit,
            user.createdAt,
            user.updatedAt,
          ],
        });
        console.log(`   ✓ User: ${user.name}`);
      } catch (error) {
        console.error(`   ✗ Failed to migrate user ${user.name}:`, error);
      }
    }

    // ===== CATEGORIES =====
    console.log("\n📁 Migrating Categories...");
    const categoriesResult = await localClient.execute("SELECT * FROM Category");
    const categories = categoriesResult.rows as unknown as Category[];
    console.log(`   Found ${categories.length} categories`);

    for (const category of categories) {
      try {
        await tursoClient.execute({
          sql: `INSERT OR REPLACE INTO Category (id, name, color, icon, createdAt, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            category.id,
            category.name,
            category.color,
            category.icon,
            category.createdAt,
            category.updatedAt,
          ],
        });
        console.log(`   ✓ Category: ${category.name}`);
      } catch (error) {
        console.error(`   ✗ Failed to migrate category ${category.name}:`, error);
      }
    }

    // ===== BUDGETS =====
    console.log("\n💰 Migrating Budgets...");
    const budgetsResult = await localClient.execute("SELECT * FROM Budget");
    const budgets = budgetsResult.rows as unknown as Budget[];
    console.log(`   Found ${budgets.length} budgets`);

    for (const budget of budgets) {
      try {
        await tursoClient.execute({
          sql: `INSERT OR REPLACE INTO Budget (id, userId, monthlyLimit, month, year, createdAt, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            budget.id,
            budget.userId,
            budget.monthlyLimit,
            budget.month,
            budget.year,
            budget.createdAt,
            budget.updatedAt,
          ],
        });
        console.log(`   ✓ Budget: ${budget.month}/${budget.year} - ₹${budget.monthlyLimit}`);
      } catch (error) {
        console.error(`   ✗ Failed to migrate budget:`, error);
      }
    }

    // ===== EXPENSES =====
    console.log("\n💸 Migrating Expenses...");
    const expensesResult = await localClient.execute("SELECT * FROM Expense");
    const expenses = expensesResult.rows as unknown as Expense[];
    console.log(`   Found ${expenses.length} expenses`);

    let expenseCount = 0;
    for (const expense of expenses) {
      try {
        await tursoClient.execute({
          sql: `INSERT OR REPLACE INTO Expense (
                  id, userId, description, amount, date, categoryId, type, 
                  isProjected, isPaid, recurringFrequency, dayOfMonth, 
                  nextDueDate, endDate, isActive, isCompleted, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            expense.id,
            expense.userId,
            expense.description,
            expense.amount,
            expense.date,
            expense.categoryId,
            expense.type,
            expense.isProjected,
            expense.isPaid,
            expense.recurringFrequency,
            expense.dayOfMonth,
            expense.nextDueDate,
            expense.endDate,
            expense.isActive,
            expense.isCompleted,
            expense.createdAt,
            expense.updatedAt,
          ],
        });
        expenseCount++;
      } catch (error) {
        console.error(`   ✗ Failed to migrate expense ${expense.description}:`, error);
      }
    }
    console.log(`   ✓ Migrated ${expenseCount} expenses`);

    // ===== SETTINGS =====
    console.log("\n⚙️  Migrating Settings...");
    const settingsResult = await localClient.execute("SELECT * FROM Settings");
    const settings = settingsResult.rows as unknown as Settings[];
    console.log(`   Found ${settings.length} settings records`);

    for (const setting of settings) {
      try {
        await tursoClient.execute({
          sql: `INSERT OR REPLACE INTO Settings (id, usdConversionRate, createdAt, updatedAt) 
                VALUES (?, ?, ?, ?)`,
          args: [
            setting.id,
            setting.usdConversionRate,
            setting.createdAt,
            setting.updatedAt,
          ],
        });
        console.log(`   ✓ Settings: USD rate = ${setting.usdConversionRate}`);
      } catch (error) {
        console.error(`   ✗ Failed to migrate settings:`, error);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ Migration complete!");
    console.log("=".repeat(50));
    console.log("\nSummary:");
    console.log(`   Users:      ${users.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Budgets:    ${budgets.length}`);
    console.log(`   Expenses:   ${expenseCount}`);
    console.log(`   Settings:   ${settings.length}`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    localClient.close();
    tursoClient.close();
  }
}

migrateToTurso().catch((error) => {
  console.error(error);
  process.exit(1);
});


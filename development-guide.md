# Budgie Development Guide

This guide documents development practices and conventions for the Budgie expense tracker project.

## Table of Contents

1. [Database & Schema Management](#database--schema-management)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Best Practices](#best-practices)

---

## Database & Schema Management

### Overview

Budgie uses a dual-database setup:
- **Local SQLite** (`prisma/dev.db`) - Used for schema validation and local development
- **Turso (libSQL)** - Production database hosted in the cloud

The connection to Turso is configured via `@prisma/adapter-libsql` in `lib/prisma.ts`.

### ⚠️ Critical Rule: Always Write Migrations

**When changing the backend schema, ALWAYS write a migration and ensure data is ported correctly.**

Never directly modify the production database schema. All schema changes must go through the migration process to:
- Maintain a history of schema changes
- Ensure data integrity during schema transitions
- Enable rollback capabilities
- Keep all environments in sync

---

### Schema Change Workflow

#### Step 1: Modify the Prisma Schema

Edit `prisma/schema.prisma` with your changes:

```prisma
// Example: Adding a new field to Category
model Category {
  id           String   @id @default(cuid())
  name         String   @unique
  color        String
  icon         String?
  budgetLimit  Float?              // New field
  isGlobalLimit Boolean @default(true)  // New field
  // ... rest of the model
}
```

#### Step 2: Create a Migration File

Create a new migration in `prisma/migrations/` with the format:
```
YYYYMMDDHHMMSS_descriptive_name/migration.sql
```

For example: `20260105181052_add_category_budgets/migration.sql`

#### Step 3: Write the Migration SQL

The migration SQL should include:

1. **Schema changes** (ALTER TABLE, CREATE TABLE, etc.)
2. **Data migration** (UPDATE, INSERT statements to port existing data)
3. **Index creation** (for performance)
4. **Cleanup** (DROP old tables/columns if applicable)

**Example Migration (Adding columns):**

```sql
-- AlterTable: Add budgetLimit and isGlobalLimit columns to Category
-- Existing categories will have NULL budgetLimit and isGlobalLimit = true

-- Add budgetLimit column (nullable)
ALTER TABLE "Category" ADD COLUMN "budgetLimit" REAL;

-- Add isGlobalLimit column with default value
ALTER TABLE "Category" ADD COLUMN "isGlobalLimit" BOOLEAN NOT NULL DEFAULT true;
```

**Example Migration (Data migration between tables):**

```sql
-- Add new columns to Expense
ALTER TABLE "Expense" ADD COLUMN "type" TEXT;
ALTER TABLE "Expense" ADD COLUMN "isProjected" BOOLEAN;

-- Set defaults for existing expenses
UPDATE "Expense" SET "type" = 'regular' WHERE "type" IS NULL;
UPDATE "Expense" SET "isProjected" = false WHERE "isProjected" IS NULL;

-- Data Migration: Migrate RecurringBill data to Expense
INSERT INTO "Expense" (
  "id", "userId", "description", "amount", "date", "categoryId",
  "type", "isProjected", "recurringFrequency", "dayOfMonth",
  "nextDueDate", "isActive", "createdAt", "updatedAt"
)
SELECT 
  "id", "userId", "title" as "description", "amount",
  "nextDueDate" as "date", "categoryId",
  'recurring' as "type", true as "isProjected",
  "frequency" as "recurringFrequency", "dayOfMonth",
  "nextDueDate", "isActive", "createdAt", "updatedAt"
FROM "RecurringBill";

-- DropTable: Remove old tables
DROP TABLE "RecurringBill";

-- CreateIndex
CREATE INDEX "Expense_type_idx" ON "Expense"("type");
```

#### Step 4: Apply Migration Locally

Run Prisma migrate to apply the migration to your local SQLite database:

```bash
npx prisma migrate dev
```

This will:
- Apply the migration to `prisma/dev.db`
- Regenerate the Prisma Client
- Update the migration history

#### Step 5: Push Schema to Turso

After verifying locally, push the schema to Turso:

```bash
npm run db:push-turso
```

This command:
1. Generates the schema SQL from Prisma
2. Runs `scripts/apply-turso-schema.ts` to intelligently apply changes
3. Handles existing tables by adding only missing columns

#### Step 6: Migrate Data to Turso (if needed)

If you need to migrate data from local to Turso:

```bash
npm run db:migrate-to-turso
```

---

### Migration Best Practices

#### DO ✅

- **Always write idempotent migrations** - They should be safe to run multiple times
- **Include data migration in the same migration file** - Keep schema and data changes together
- **Set sensible defaults for new columns** - Avoid breaking existing data
- **Add indexes for frequently queried columns**
- **Test migrations locally before pushing to Turso**
- **Comment your SQL migrations** - Explain what each section does
- **Handle NULL values explicitly** - Use `WHERE column IS NULL` when updating

#### DON'T ❌

- **Never modify or delete existing migration files** - Create new migrations instead
- **Never use `prisma db push` directly on production** - Always use proper migrations
- **Never delete columns without migrating data first**
- **Never assume columns exist** - Check with `IF EXISTS` when needed

---

### Available Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:seed` | Seed the database with initial data |
| `npm run db:push-turso` | Push schema changes to Turso |
| `npm run db:migrate-to-turso` | Migrate all data from local to Turso |
| `npm run db:verify-reminders` | Verify reminder data integrity |
| `npx prisma migrate dev` | Apply migrations locally |
| `npx prisma generate` | Regenerate Prisma Client |
| `npx prisma studio` | Open Prisma Studio GUI |

---

### Handling Complex Migrations

#### Renaming a Column

SQLite doesn't support direct column renames. Use this approach:

```sql
-- 1. Add new column
ALTER TABLE "Expense" ADD COLUMN "newColumnName" TEXT;

-- 2. Copy data
UPDATE "Expense" SET "newColumnName" = "oldColumnName";

-- 3. Note: SQLite doesn't support DROP COLUMN in older versions
-- For SQLite, you may need to recreate the table
```

#### Changing Column Type

```sql
-- 1. Add new column with correct type
ALTER TABLE "Expense" ADD COLUMN "amount_new" REAL;

-- 2. Copy and convert data
UPDATE "Expense" SET "amount_new" = CAST("amount" AS REAL);

-- 3. If needed, recreate table (SQLite limitation)
```

#### Merging Tables

See the `20260104153353_unify_expenses` migration for a comprehensive example of:
- Adding new columns to target table
- Migrating data from multiple source tables
- Setting appropriate defaults
- Dropping old tables
- Creating new indexes

---

## Project Structure

```
budgie/
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions
│   ├── api/               # API Routes
│   └── [pages]/           # Page components
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities
│   ├── prisma.ts         # Database connection
│   └── utils.ts          # Helper functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration files
│   └── seed.ts           # Seed data
├── scripts/              # Utility scripts
└── public/               # Static assets
```

---

## Development Workflow

### Starting Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# For PWA testing with HTTPS
npm run dev -- --experimental-https
```

### Adding a New Feature

1. **Plan the data model changes** (if any)
2. **Write the migration** (see above)
3. **Update Prisma schema**
4. **Apply migration locally**: `npx prisma migrate dev`
5. **Implement the feature**
6. **Test locally**
7. **Push schema to Turso**: `npm run db:push-turso`
8. **Deploy**

### Adding UI Components

Use shadcn/ui for consistent styling:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
# etc.
```

> ⚠️ Note: The package name is `shadcn@latest`, NOT `shadcn-ui`.

---

## Best Practices

### Code Style

- Use TypeScript for all new files
- Follow existing patterns in the codebase
- Use Server Actions for database operations
- Keep components small and focused

### Database

- Always use migrations for schema changes
- Index columns used in WHERE clauses
- Use transactions for multi-step operations
- Handle cascade deletes appropriately

### Performance

- Use database indexes for frequently queried columns
- Implement pagination for large datasets
- Use React Server Components where possible
- Optimize images and assets

### Security

- Never expose sensitive data in client components
- Validate all user input
- Use environment variables for secrets
- Sanitize database queries (Prisma handles this)

---

## Environment Variables

Required environment variables in `.env`:

```env
# Database (Turso)
DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_auth_token

# PWA Push Notifications (VAPID keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

Generate VAPID keys with:
```bash
npx web-push generate-vapid-keys
```

---

## Troubleshooting

### Migration Issues

**Problem**: Migration fails due to existing data
**Solution**: Add data migration steps before schema changes

**Problem**: "Column already exists" error on Turso
**Solution**: The `apply-turso-schema.ts` script handles this automatically

**Problem**: Prisma Client out of sync
**Solution**: Run `npx prisma generate`

### Database Connection Issues

**Problem**: Cannot connect to Turso
**Solution**: Verify `DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env`

**Problem**: Local database is empty
**Solution**: Run `npm run db:seed` or `npx prisma migrate dev`

---

## Quick Reference

```bash
# Schema changes workflow
1. Edit prisma/schema.prisma
2. Create migration file in prisma/migrations/
3. npx prisma migrate dev
4. npm run db:push-turso

# Useful commands
npx prisma studio          # Visual database browser
npx prisma format          # Format schema file
npx prisma validate        # Validate schema
```


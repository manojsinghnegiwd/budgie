# Budgie Development Guide

This guide documents development practices and conventions for the Budgie expense tracker project.

## Table of Contents

1. [Database & Schema Management](#database--schema-management)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [React Server Components Architecture](#react-server-components-architecture)
5. [Best Practices](#best-practices)

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
5. **Plan the component architecture** (see [React Server Components Architecture](#react-server-components-architecture))
   - Identify which components need to be Server Components (data fetching)
   - Identify which components need to be Client Components (interactivity)
   - Use the wrapper pattern if both are needed
6. **Implement the feature**
7. **Test locally**
8. **Push schema to Turso**: `npm run db:push-turso`
9. **Deploy**

### Adding UI Components

Use shadcn/ui for consistent styling:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
# etc.
```

> ⚠️ Note: The package name is `shadcn@latest`, NOT `shadcn-ui`.

---

## React Server Components Architecture

### Overview

Budgie uses Next.js 16 with React Server Components (RSC) to optimize performance and reduce client-side JavaScript. This section documents the architectural patterns used to ensure new features automatically support RSC.

### ⚠️ Critical Rule: Server/Client Component Separation

**When a client component imports a module, that entire module tree becomes part of the client bundle. Async components only work in Server Components.**

This means:
- **Server Components** can be `async` and directly call Server Actions
- **Client Components** (marked with `"use client"`) cannot be `async`
- **Never import async Server Components directly into Client Components**

---

### The Wrapper Pattern

The recommended pattern for features that need both server-side data fetching and client-side interactivity is the **Wrapper Pattern**:

1. **Server Component** (page) renders data-fetching components
2. **Wrapper Component** (client) handles interactivity and state
3. **Server Components** are passed as `children` to the wrapper

#### Example Structure

```
app/feature/[id]/page.tsx          # Server Component (page)
  └─> FeatureWrapper               # Client Component (wrapper)
       └─> FeatureContent          # Server Component (children)
            └─> FeatureSection     # Server Component (async)
```

#### Implementation Example

**1. Page Component (Server Component)**

```tsx
// app/feature/[id]/page.tsx
import { cookies } from "next/headers";
import { FeatureWrapper } from "@/components/feature/feature-wrapper";
import { FeatureContent } from "@/components/feature/feature-content";

export default async function FeaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Get client state from cookies for server-side rendering
  const cookieStore = await cookies();
  const userId = cookieStore.get("selectedUserId")?.value || null;

  return (
    <DashboardWrapper>
      <FeatureWrapper id={id}>
        {userId ? (
          <FeatureContent userId={userId} id={id} />
        ) : null}
      </FeatureWrapper>
    </DashboardWrapper>
  );
}
```

**2. Wrapper Component (Client Component)**

```tsx
// components/feature/feature-wrapper.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { FeatureControls } from "@/components/feature/feature-controls";

interface FeatureWrapperProps {
  id: string;
  children: React.ReactNode;  // Server Components passed as children
}

export function FeatureWrapper({ id, children }: FeatureWrapperProps) {
  const { selectedUserId } = useUser();
  const router = useRouter();

  const handleRefresh = useCallback(() => {
    router.refresh();  // Re-runs all Server Components
  }, [router]);

  if (!selectedUserId) {
    return <div>Please select a user</div>;
  }

  return (
    <>
      <FeatureControls id={id} onRefresh={handleRefresh} />
      {children}  {/* Server Components rendered here */}
    </>
  );
}
```

**3. Content Component (Server Component)**

```tsx
// components/feature/feature-content.tsx
import { Suspense } from "react";
import { FeatureSection } from "@/components/feature/feature-section";

interface FeatureContentProps {
  userId: string;
  id: string;
}

export function FeatureContent({ userId, id }: FeatureContentProps) {
  return (
    <Suspense fallback={<Skeleton />}>
      <FeatureSection userId={userId} id={id} />
    </Suspense>
  );
}
```

**4. Section Component (Async Server Component)**

```tsx
// components/feature/feature-section.tsx
import { getFeatureData } from "@/app/actions/feature";

interface FeatureSectionProps {
  userId: string;
  id: string;
}

export async function FeatureSection({ userId, id }: FeatureSectionProps) {
  const data = await getFeatureData(userId, id);
  
  return <div>{/* Render data */}</div>;
}
```

---

### Accessing Client State on the Server

When you need client-side state (like `selectedUserId`) in Server Components, use **cookies**:

**1. Update User Provider to Sync Cookies**

```tsx
// components/user-provider.tsx
const setSelectedUserId = (userId: string | null) => {
  setSelectedUserIdState(userId);
  if (userId) {
    localStorage.setItem("selectedUserId", userId);
    // Sync to cookie for server-side access
    document.cookie = `selectedUserId=${userId}; path=/; max-age=31536000; SameSite=Lax`;
  } else {
    localStorage.removeItem("selectedUserId");
    document.cookie = "selectedUserId=; path=/; max-age=0";
  }
};

useEffect(() => {
  const stored = localStorage.getItem("selectedUserId");
  if (stored && users.some((u) => u.id === stored)) {
    setSelectedUserIdState(stored);
    // Sync to cookie on mount
    document.cookie = `selectedUserId=${stored}; path=/; max-age=31536000; SameSite=Lax`;
  }
}, [users]);
```

**2. Read from Cookies in Server Components**

```tsx
// app/feature/page.tsx
import { cookies } from "next/headers";

export default async function FeaturePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("selectedUserId")?.value || null;
  
  // Use userId in Server Components
  return <FeatureContent userId={userId} />;
}
```

---

### Common Patterns

#### Pattern 1: Dashboard/List Pages

```tsx
// app/dashboard/page.tsx (Server Component)
export default async function Dashboard({ searchParams }) {
  const month = /* parse from searchParams */;
  const year = /* parse from searchParams */;
  
  return (
    <DashboardWrapper>  {/* Client Component */}
      <DashboardControls month={month} year={year} />  {/* Client Component */}
      <DashboardContent month={month} year={year} />  {/* Server Component */}
    </DashboardWrapper>
  );
}
```

#### Pattern 2: Detail Pages with User Context

```tsx
// app/category/[id]/page.tsx (Server Component)
export default async function CategoryPage({ params, searchParams }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get("selectedUserId")?.value || null;
  
  return (
    <DashboardWrapper>
      <CategoryWrapper id={id}>  {/* Client Component */}
        {userId ? (
          <CategoryContent userId={userId} id={id} />  {/* Server Component */}
        ) : null}
      </CategoryWrapper>
    </DashboardWrapper>
  );
}
```

#### Pattern 3: Client-Side Data Fetching (When Needed)

If you need to fetch data based on client-side state that changes frequently, use client-side fetching:

```tsx
// components/feature/feature-client-section.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/user-provider";
import { getFeatureData } from "@/app/actions/feature";

export function FeatureClientSection({ id }: { id: string }) {
  const { selectedUserId } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedUserId) {
      setLoading(false);
      return;
    }

    getFeatureData(selectedUserId, id).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [selectedUserId, id]);

  if (loading) return <Skeleton />;
  return <div>{/* Render data */}</div>;
}
```

---

### DO ✅

- **Separate Server and Client Components clearly** - Use the wrapper pattern
- **Pass Server Components as children** - This keeps them in the server bundle
- **Use cookies for client state on server** - Sync important state like `selectedUserId`
- **Use Suspense boundaries** - Wrap async Server Components for better UX
- **Keep async components in Server Components** - Never make Client Components async
- **Use Server Actions for data mutations** - Even from Client Components

### DON'T ❌

- **Never import async Server Components into Client Components directly** - Use children pattern instead
- **Never add `"use client"` to async components** - Async only works in Server Components
- **Never call Server Actions during render** - Use `useEffect` or event handlers
- **Never access localStorage in Server Components** - Use cookies for server access
- **Never mix server and client code in the same component** - Keep boundaries clear

---

### Troubleshooting RSC Issues

**Error**: `<Component> is an async Client Component. Only Server Components can be async.`

**Solution**: 
1. Check if the component has `"use client"` directive
2. Check if it's imported by a Client Component
3. Move the async component to be a child of a Server Component
4. Use the wrapper pattern to separate concerns

**Error**: `Cannot update a component (Router) while rendering a different component`

**Solution**: 
1. This happens when Server Actions are called during render
2. Move Server Action calls to `useEffect` or event handlers
3. Or ensure the component is a Server Component (not Client Component)

**Error**: Client state not available in Server Component

**Solution**:
1. Sync the state to cookies in the Client Component
2. Read from cookies using `cookies()` in the Server Component
3. Pass the value as props to child Server Components

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
- **Use React Server Components where possible** - Follow the [RSC Architecture](#react-server-components-architecture) patterns
- Optimize images and assets
- Pass Server Components as children to Client Components to keep them in the server bundle

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


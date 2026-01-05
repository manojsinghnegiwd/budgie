-- AlterTable: Add isShared column to Category
-- When a category is shared, all users can see expenses in that category
-- and those expenses will be included in everyone's stats
ALTER TABLE "Category" ADD COLUMN "isShared" BOOLEAN NOT NULL DEFAULT false;


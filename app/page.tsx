import { Suspense } from "react";
import { getCategories } from "@/app/actions/categories";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { DashboardControls } from "@/components/dashboard/dashboard-controls";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

interface DashboardProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  // Pre-fetch categories for the AddExpenseDialog
  const categories = await getCategories();

  // Parse month and year from search params, default to current month/year
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  return (
    <DashboardWrapper>
      <DashboardControls categories={categories} month={month} year={year} />
      <DashboardContent month={month} year={year} />
    </DashboardWrapper>
  );
}

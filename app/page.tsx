import { Suspense } from "react";
import { cookies } from "next/headers";
import { getCategories } from "@/app/actions/categories";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { DashboardControls } from "@/components/dashboard/dashboard-controls";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

interface DashboardProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

// Helper function to resolve viewUserId
function resolveViewUserId(
  viewUserId: string | null | undefined,
  selectedUserId: string | null
): string | null {
  if (viewUserId === "all") return null; // null means all users in server actions
  if (viewUserId === null || viewUserId === undefined) {
    // Default to current user
    return selectedUserId;
  }
  return viewUserId;
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  // Pre-fetch categories for the AddExpenseDialog
  const categories = await getCategories();

  // Parse month and year from search params, default to current month/year
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  // Get viewUserId and selectedUserId from cookies
  const cookieStore = await cookies();
  const viewUserIdCookie = cookieStore.get("viewUserId")?.value;
  const selectedUserId = cookieStore.get("selectedUserId")?.value || null;
  
  // Get selectedCategories from cookies
  const selectedCategoriesCookie = cookieStore.get("selectedCategories")?.value;
  let categoryIds: string[] | null = null;
  if (selectedCategoriesCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(selectedCategoriesCookie));
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Only set if not all categories are selected
        const allCategoryIds = categories.map((c) => c.id);
        const isAllSelected = parsed.length === allCategoryIds.length && 
          parsed.every((id) => allCategoryIds.includes(id));
        if (!isAllSelected) {
          categoryIds = parsed;
        }
      }
    } catch (e) {
      // Invalid JSON, ignore
    }
  }
  
  // Resolve the actual userId to use for data fetching
  const viewUserId = resolveViewUserId(
    viewUserIdCookie === "all" ? "all" : viewUserIdCookie || null,
    selectedUserId
  );

  return (
    <DashboardWrapper>
      <DashboardControls categories={categories} month={month} year={year} />
      <DashboardContent month={month} year={year} viewUserId={viewUserId} categoryIds={categoryIds} />
    </DashboardWrapper>
  );
}

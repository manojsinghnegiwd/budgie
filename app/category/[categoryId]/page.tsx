import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCategories } from "@/app/actions/categories";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { CategoryWrapper } from "@/components/category/category-wrapper";
import { CategoryContent } from "@/components/category/category-content";

interface CategoryPageProps {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function CategoryDetailPage({ params, searchParams }: CategoryPageProps) {
  const { categoryId } = await params;
  const searchParamsResolved = await searchParams;
  
  // Parse month and year from search params, default to current month/year
  const now = new Date();
  const month = searchParamsResolved.month ? parseInt(searchParamsResolved.month) : now.getMonth() + 1;
  const year = searchParamsResolved.year ? parseInt(searchParamsResolved.year) : now.getFullYear();

  // Fetch categories to find the category
  const categories = await getCategories();
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    redirect("/");
  }

  // Get userId from cookie for server-side rendering
  const cookieStore = await cookies();
  const userId = cookieStore.get("selectedUserId")?.value || null;

  return (
    <DashboardWrapper>
      <CategoryWrapper
        category={category}
        categories={categories}
        categoryId={categoryId}
        month={month}
        year={year}
      >
        {userId ? (
          <CategoryContent
            userId={userId}
            categoryId={categoryId}
            categoryName={category.name}
            month={month}
            year={year}
          />
        ) : null}
      </CategoryWrapper>
    </DashboardWrapper>
  );
}

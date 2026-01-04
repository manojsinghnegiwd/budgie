import { getGlobalStats } from "@/app/actions/global-stats";
import { GlobalStats } from "@/components/global-stats";
import { UserComparisonChart } from "@/components/user-comparison-chart";
import { UserSpendingTable } from "@/components/user-spending-table";
import { CategoryChart } from "@/components/category-chart";

export default async function GlobalDashboardPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const stats = await getGlobalStats(currentMonth, currentYear);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Global Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date(currentYear, currentMonth - 1).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <GlobalStats overall={stats.overall} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UserComparisonChart data={stats.byUser} />
        <CategoryChart data={stats.overall.byCategory} />
      </div>

      <UserSpendingTable data={stats.byUser} />
    </div>
  );
}


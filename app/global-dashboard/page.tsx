"use client";

import { useEffect, useState, useCallback } from "react";
import { getGlobalStats } from "@/app/actions/global-stats";
import { GlobalStats } from "@/components/global-stats";
import { UserComparisonChart } from "@/components/user-comparison-chart";
import { UserSpendingTable } from "@/components/user-spending-table";
import { CategoryChart } from "@/components/category-chart";
import { PullToRefresh } from "@/components/pull-to-refresh";

interface GlobalStatsData {
  month: number;
  year: number;
  overall: {
    total: number;
    budget: number;
    spent: number;
    remaining: number;
    byCategory: Array<{ name: string; color: string; amount: number }>;
    count: number;
  };
  byUser: Array<{
    userId: string;
    userName: string;
    total: number;
    budgetLimit: number;
    spent: number;
    remaining: number;
    count: number;
    byCategory: Array<{ name: string; color: string; amount: number }>;
  }>;
}

export default function GlobalDashboardPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [stats, setStats] = useState<GlobalStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getGlobalStats(currentMonth, currentYear);
      setStats(data);
    } catch (error) {
      console.error("Error loading global stats:", error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    await loadData(false);
  }, [loadData]);

  if (loading || !stats) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold">Global Dashboard</h1>
            <p className="text-muted-foreground">
              {new Date(currentYear, currentMonth - 1).toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Global Dashboard</h1>
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
    </PullToRefresh>
  );
}

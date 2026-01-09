"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/user-provider";
import { getCurrentBudget } from "@/app/actions/budget";
import { getCategories } from "@/app/actions/categories";
import { getSettings } from "@/app/actions/settings";
import { BudgetSettings } from "@/components/budget-settings";
import { CategorySettings } from "@/components/category-settings";
import { CurrencySettings } from "@/components/currency-settings";
import { UserSettings } from "@/components/user-settings";
import { UserManagement } from "@/components/user-management";
import { NotificationSettings } from "@/components/notification-settings";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { GlobalBudget, Category } from "@/lib/prisma";
import type { Currency } from "@/lib/utils";

export default function SettingsPage() {
  const { selectedUserId, selectedUser } = useUser();
  const [budget, setBudget] = useState<GlobalBudget | { monthlyLimit: number; month: number; year: number } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<{ usdConversionRate: number; currency: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGlobalData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [budgetData, categoriesData, settingsData] = await Promise.all([
        getCurrentBudget(),
        getCategories(),
        getSettings(),
      ]);
      setBudget(budgetData);
      setCategories(categoriesData);
      setSettings(settingsData);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGlobalData();
  }, [loadGlobalData]);

  const handleRefresh = useCallback(async () => {
    await loadGlobalData(false);
  }, [loadGlobalData]);

  // Listen for refresh event from mobile header
  useEffect(() => {
    const handleRefreshEvent = () => {
      handleRefresh();
    };
    window.addEventListener('refresh-page', handleRefreshEvent);
    return () => window.removeEventListener('refresh-page', handleRefreshEvent);
  }, [handleRefresh]);

  if (loading || !budget || !settings) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>
          <div className="space-y-8">
            <UserManagement />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-8 w-8 md:h-9 md:w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-8">
          <UserManagement />
          <NotificationSettings />
          {selectedUser && (
            <UserSettings initialName={selectedUser.name} userId={selectedUser.id} />
          )}
          <CurrencySettings 
            initialConversionRate={settings.usdConversionRate} 
            initialCurrency={(settings.currency as Currency) || "INR"}
          />
          <BudgetSettings budget={budget} />
          <CategorySettings categories={categories} />
        </div>
      </div>
    </PullToRefresh>
  );
}

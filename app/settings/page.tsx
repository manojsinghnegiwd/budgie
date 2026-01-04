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
import type { Budget, Category } from "@/lib/prisma";

export default function SettingsPage() {
  const { selectedUserId, selectedUser } = useUser();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<{ usdConversionRate: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (showLoading = true) => {
    if (!selectedUserId) {
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    try {
      const [budgetData, categoriesData, settingsData] = await Promise.all([
        getCurrentBudget(selectedUserId),
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
  }, [selectedUserId]);

  const loadGlobalData = useCallback(async () => {
    try {
      const [categoriesData, settingsData] = await Promise.all([
        getCategories(),
        getSettings(),
      ]);
      setCategories(categoriesData);
      setSettings(settingsData);
    } catch (error) {
      console.error("Error loading global settings:", error);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Load settings and categories even when no user is selected (they're global)
  useEffect(() => {
    loadGlobalData();
  }, [loadGlobalData]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadUserData(false), loadGlobalData()]);
  }, [loadUserData, loadGlobalData]);

  if (!selectedUserId) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>
          <div className="space-y-8">
            <UserManagement />
            <NotificationSettings />
            {settings && (
              <CurrencySettings initialConversionRate={settings.usdConversionRate} />
            )}
            {categories.length > 0 && (
              <CategorySettings categories={categories} />
            )}
          </div>
        </div>
      </PullToRefresh>
    );
  }

  if (loading || !budget || !settings) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>
          <div className="space-y-8">
            <UserManagement />
            <p className="text-muted-foreground">Loading user settings...</p>
          </div>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>
        <div className="space-y-8">
          <UserManagement />
          <NotificationSettings />
          {selectedUser && (
            <UserSettings initialName={selectedUser.name} userId={selectedUser.id} />
          )}
          <CurrencySettings initialConversionRate={settings.usdConversionRate} />
          <BudgetSettings budget={budget} />
          <CategorySettings categories={categories} />
        </div>
      </div>
    </PullToRefresh>
  );
}

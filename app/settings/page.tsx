"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/user-provider";
import { getCurrentBudget } from "@/app/actions/budget";
import { getCategories } from "@/app/actions/categories";
import { getSettings } from "@/app/actions/settings";
import { BudgetSettings } from "@/components/budget-settings";
import { CategorySettings } from "@/components/category-settings";
import { CurrencySettings } from "@/components/currency-settings";
import { UserSettings } from "@/components/user-settings";
import { UserManagement } from "@/components/user-management";
import type { Budget, Category } from "@/lib/prisma";

export default function SettingsPage() {
  const { selectedUserId, selectedUser } = useUser();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<{ usdConversionRate: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedUserId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
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
    };

    loadData();
  }, [selectedUserId]);

  // Load settings and categories even when no user is selected (they're global)
  useEffect(() => {
    const loadGlobalData = async () => {
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
    };

    loadGlobalData();
  }, []);

  if (!selectedUserId) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>
        <div className="space-y-8">
          <UserManagement />
          {settings && (
            <CurrencySettings initialConversionRate={settings.usdConversionRate} />
          )}
          {categories.length > 0 && (
            <CategorySettings categories={categories} />
          )}
        </div>
      </div>
    );
  }

  if (loading || !budget || !settings) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>
        <div className="space-y-8">
          <UserManagement />
          <p className="text-muted-foreground">Loading user settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-8">
        <UserManagement />
        {selectedUser && (
          <UserSettings initialName={selectedUser.name} userId={selectedUser.id} />
        )}
        <CurrencySettings initialConversionRate={settings.usdConversionRate} />
        <BudgetSettings budget={budget} />
        <CategorySettings categories={categories} />
      </div>
    </div>
  );
}

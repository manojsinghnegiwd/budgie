"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/user-provider";
import { getInvestments, getInvestmentStats } from "@/app/actions/investments";
import { INVESTMENT_TYPES } from "@/lib/investment-types";
import { InvestmentsTable } from "@/components/investments-table";
import { InvestmentStats } from "@/components/investment-stats";
import { AddInvestmentDialog } from "@/components/add-investment-dialog";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, SlidersHorizontal, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Investment } from "@/lib/prisma";

export default function InvestmentsPage() {
  const { selectedUserId } = useUser();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stats, setStats] = useState<{
    totalInvested: number;
    totalCurrentValue: number;
    totalGainLoss: number;
    gainLossPercentage: number;
    count: number;
    byType: Array<{
      type: string;
      invested: number;
      currentValue: number;
      count: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = typeFilter !== "all" || startDate || endDate;

  const loadData = useCallback(
    async (showLoading = true) => {
      if (!selectedUserId) {
        setLoading(false);
        return;
      }

      if (showLoading) setLoading(true);
      try {
        const [investmentsData, statsData] = await Promise.all([
          getInvestments(selectedUserId, {
            type: typeFilter === "all" ? undefined : typeFilter,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
          }),
          getInvestmentStats(selectedUserId),
        ]);
        setInvestments(investmentsData);
        setStats(statsData);
      } catch (error) {
        console.error("Error loading investments:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedUserId, typeFilter, startDate, endDate]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    await loadData(false);
  }, [loadData]);

  if (!selectedUserId) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">Investments</h1>
          <p className="text-muted-foreground mt-4">
            Please select a user from the header.
          </p>
        </div>
      </PullToRefresh>
    );
  }

  if (loading) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">Investments</h1>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Investments</h1>
          <div className="hidden md:block">
            <AddInvestmentDialog onSuccess={handleRefresh} />
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-3">
            <InvestmentStats stats={stats} />
          </div>
        )}

        {/* Mobile Filter Toggle */}
        <div className="md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  !
                </span>
              )}
            </span>
            <ChevronUp
              className={cn(
                "h-4 w-4 transition-transform",
                !filtersOpen && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Filters Section */}
        <div
          className={cn(
            "space-y-4 overflow-hidden transition-all duration-300",
            filtersOpen
              ? "max-h-[500px] opacity-100"
              : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
          )}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {INVESTMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="start-date" className="whitespace-nowrap">
                  From
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full md:w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="end-date" className="whitespace-nowrap">
                  To
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full md:w-auto"
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTypeFilter("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="w-full md:w-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Add Button */}
        <div className="md:hidden">
          <AddInvestmentDialog onSuccess={handleRefresh} />
        </div>

        {/* Investments Table */}
        <InvestmentsTable investments={investments} onUpdate={handleRefresh} />
      </div>
    </PullToRefresh>
  );
}

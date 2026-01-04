"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/components/currency-provider";
import { deleteInvestment } from "@/app/actions/investments";
import {
  getInvestmentTypeLabel,
  getInvestmentTypeColor,
} from "@/lib/investment-types";
import { EditInvestmentDialog } from "@/components/edit-investment-dialog";
import { Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Investment } from "@/lib/prisma";

interface InvestmentsTableProps {
  investments: Investment[];
  onUpdate?: () => void;
}

export function InvestmentsTable({ investments, onUpdate }: InvestmentsTableProps) {
  const { formatCurrencyAmount } = useCurrency();
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this investment?")) return;

    setDeletingId(id);
    try {
      await deleteInvestment(id);
      onUpdate?.();
    } catch (error) {
      console.error("Error deleting investment:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const getGainLoss = (investment: Investment) => {
    return investment.currentValue - investment.investedAmount;
  };

  const getGainLossPercentage = (investment: Investment) => {
    if (investment.investedAmount === 0) return 0;
    return (
      ((investment.currentValue - investment.investedAmount) /
        investment.investedAmount) *
      100
    );
  };

  if (investments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No investments found. Start tracking your portfolio!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Invested</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">Returns</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.map((investment) => {
              const gainLoss = getGainLoss(investment);
              const percentage = getGainLossPercentage(investment);
              const isPositive = gainLoss >= 0;

              return (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{investment.name}</p>
                      {investment.units && (
                        <p className="text-xs text-muted-foreground">
                          {investment.units} units
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: getInvestmentTypeColor(investment.type),
                        color: getInvestmentTypeColor(investment.type),
                      }}
                    >
                      {getInvestmentTypeLabel(investment.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyAmount(investment.investedAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyAmount(investment.currentValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={cn(
                        "flex items-center justify-end gap-1",
                        isPositive ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>
                        {isPositive ? "+" : ""}
                        {formatCurrencyAmount(gainLoss)}
                      </span>
                      <span className="text-xs">
                        ({isPositive ? "+" : ""}
                        {percentage.toFixed(2)}%)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(investment.purchaseDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingInvestment(investment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(investment.id)}
                        disabled={deletingId === investment.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {investments.map((investment) => {
          const gainLoss = getGainLoss(investment);
          const percentage = getGainLossPercentage(investment);
          const isPositive = gainLoss >= 0;

          return (
            <Card key={investment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{investment.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className="mt-1"
                      style={{
                        borderColor: getInvestmentTypeColor(investment.type),
                        color: getInvestmentTypeColor(investment.type),
                      }}
                    >
                      {getInvestmentTypeLabel(investment.type)}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingInvestment(investment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(investment.id)}
                      disabled={deletingId === investment.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Invested</p>
                    <p className="font-medium">
                      {formatCurrencyAmount(investment.investedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Value</p>
                    <p className="font-medium">
                      {formatCurrencyAmount(investment.currentValue)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    {new Date(investment.purchaseDate).toLocaleDateString()}
                    {investment.units && ` · ${investment.units} units`}
                  </span>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      isPositive ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {isPositive ? "+" : ""}
                      {percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EditInvestmentDialog
        investment={editingInvestment}
        open={!!editingInvestment}
        onOpenChange={(open) => !open && setEditingInvestment(null)}
        onSuccess={onUpdate}
      />
    </>
  );
}

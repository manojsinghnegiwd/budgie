"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Insight } from "@/app/actions/insights";
import { Sparkles, TrendingUp, AlertCircle, BarChart3, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface InsightsCardProps {
  insight: Insight;
}

function getInsightSubtype(data: any): string {
  // Identify subtype based on data properties
  if (data.spent !== undefined && data.daysElapsed !== undefined) {
    return "pace_alert";
  }
  if (data.anomalies !== undefined) {
    return "anomaly_detection";
  }
  if (data.currentSpending !== undefined && data.lastMonthSameDay !== undefined) {
    return "month_over_month";
  }
  if (data.insights !== undefined) {
    return "category_insights";
  }
  if (data.currentTotal !== undefined && data.previousTotal !== undefined) {
    return "monthly_comparison";
  }
  if (data.predictedSpending !== undefined) {
    return "start_month";
  }
  return "unknown";
}

function getInsightIcon(type: string, data: any) {
  const subtype = getInsightSubtype(data);
  switch (subtype) {
    case "start_month":
      return <Calendar className="h-5 w-5" />;
    case "pace_alert":
      return <TrendingUp className="h-5 w-5" />;
    case "anomaly_detection":
      return <AlertCircle className="h-5 w-5" />;
    case "month_over_month":
      return <BarChart3 className="h-5 w-5" />;
    case "category_insights":
      return <BarChart3 className="h-5 w-5" />;
    case "monthly_comparison":
      return <BarChart3 className="h-5 w-5" />;
    default:
      return <Sparkles className="h-5 w-5" />;
  }
}

function getInsightTitle(type: string, data: any) {
  const subtype = getInsightSubtype(data);
  switch (subtype) {
    case "start_month":
      return "Monthly Forecast";
    case "pace_alert":
      return "Spending Pace";
    case "anomaly_detection":
      return "Spending Alert";
    case "month_over_month":
      return "Progress Update";
    case "category_insights":
      return "Category Insight";
    case "monthly_comparison":
      return "Monthly Summary";
    default:
      return "Insight";
  }
}

export function InsightsCard({ insight }: InsightsCardProps) {
  const subtype = getInsightSubtype(insight.data);
  const title = getInsightTitle(insight.type, insight.data);
  const icon = getInsightIcon(insight.type, insight.data);
  
  // Determine card style based on insight data
  const isWarning = 
    (subtype === "pace_alert" && insight.data.isOverBudget) ||
    (subtype === "anomaly_detection" && insight.data.topAnomaly?.isHigher);
  
  const isPositive = 
    (subtype === "month_over_month" && insight.data.isAhead) ||
    (subtype === "monthly_comparison" && insight.data.isLower) ||
    (subtype === "start_month" && !insight.data.isOverBudget);

  return (
    <Card className="relative overflow-hidden">
      {/* Gradient background for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      
      <CardHeader className="relative">
        <div className="flex items-center gap-2">
          <div className={`
            rounded-full p-2
            ${isWarning ? 'bg-red-500/10 text-red-600 dark:text-red-400' : ''}
            ${isPositive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : ''}
            ${!isWarning && !isPositive ? 'bg-primary/10 text-primary' : ''}
          `}>
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-xs">
              AI-powered insight
            </CardDescription>
          </div>
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <p className="text-base leading-relaxed">
          {insight.text}
        </p>
        
        <p className="text-xs text-muted-foreground mt-4">
          Generated {formatDistanceToNow(new Date(insight.generatedAt), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}


"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { useCurrency } from "@/components/currency-provider";
import { getForecastData } from "@/app/actions/forecast";
import type { ForecastData } from "@/app/actions/forecast";

interface FutureForecastProps {
  userId: string;
}

export function FutureForecast({ userId }: FutureForecastProps) {
  const { formatCurrencyAmount } = useCurrency();
  const [selectedDays, setSelectedDays] = useState<30 | 60 | 90>(30);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadForecast = async () => {
      setLoading(true);
      try {
        const data = await getForecastData(userId, selectedDays);
        setForecastData(data);
      } catch (error) {
        console.error("Error loading forecast data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadForecast();
    }
  }, [userId, selectedDays]);

  if (loading || !forecastData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Future Forecast</CardTitle>
          <CardDescription>Projected expenses based on recurring bills and reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Loading forecast...</p>
        </CardContent>
      </Card>
    );
  }

  // Format chart data
  const chartData = forecastData.cumulativeData.map((item) => ({
    date: format(parseISO(item.date), "MMM dd"),
    cumulative: item.cumulative,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Future Forecast</CardTitle>
        <CardDescription>Projected expenses based on recurring bills and reminders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={selectedDays.toString()} onValueChange={(value) => setSelectedDays(Number(value) as 30 | 60 | 90)}>
          <TabsList>
            <TabsTrigger value="30">30 Days</TabsTrigger>
            <TabsTrigger value="60">60 Days</TabsTrigger>
            <TabsTrigger value="90">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrencyAmount(forecastData.summary.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Over next {selectedDays} days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recurring Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forecastData.summary.billCount}</div>
              <p className="text-xs text-muted-foreground">
                Projected occurrences
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forecastData.summary.reminderCount}</div>
              <p className="text-xs text-muted-foreground">
                Upcoming reminders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Forecast Chart */}
        {chartData.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium mb-4">Cumulative Projected Spending</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    value !== undefined ? formatCurrencyAmount(value) : formatCurrencyAmount(0)
                  }
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--card-foreground))",
                    borderRadius: "0.5rem",
                    padding: "0.5rem",
                    opacity: 1,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Cumulative Projected"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No forecast data available for the selected period
          </div>
        )}

        {/* Upcoming Items List */}
        {forecastData.items.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium mb-4">Upcoming Items</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {forecastData.items.slice(0, 20).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant={item.type === "bill" ? "default" : "secondary"}>
                        {item.type === "bill" ? "Bill" : "Reminder"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge
                        style={{
                          backgroundColor: item.category.color + "20",
                          color: item.category.color,
                          borderColor: item.category.color,
                        }}
                        className="text-xs"
                      >
                        {item.category.icon && (
                          <span className="mr-1">{item.category.icon}</span>
                        )}
                        {item.category.name}
                      </Badge>
                      <span>Due: {format(new Date(item.date), "MMM dd, yyyy")}</span>
                      <span>•</span>
                      <span>{formatCurrencyAmount(item.amount)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {forecastData.items.length > 20 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Showing first 20 of {forecastData.items.length} items
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No upcoming items in the forecast period
          </div>
        )}
      </CardContent>
    </Card>
  );
}


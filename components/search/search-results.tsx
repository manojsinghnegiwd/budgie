"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchResult } from "@/app/actions/search";
import { useCurrency } from "@/components/currency-provider";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
}

export function SearchResults({ results, isLoading, query }: SearchResultsProps) {
  const { formatCurrencyAmount } = useCurrency();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!query || query.trim().length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Enter a search query to find expenses</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No expenses found matching "{query}"</p>
        <p className="text-sm mt-2">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Found {results.length} {results.length === 1 ? "result" : "results"}
      </div>

      {results.map((result) => (
        <Card key={result.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg">{result.description}</h3>
                {result.additionalDescription && (
                  <Badge variant="outline" className="text-xs">
                    + details
                  </Badge>
                )}
              </div>

              {result.additionalDescription && (
                <p className="text-sm text-muted-foreground">
                  {result.additionalDescription}
                </p>
              )}

              <div className="flex items-center gap-4 flex-wrap text-sm">
                <div className="flex items-center gap-2">
                  {result.category.icon && (
                    <span className="text-lg">{result.category.icon}</span>
                  )}
                  <span
                    className="font-medium"
                    style={{ color: result.category.color }}
                  >
                    {result.category.name}
                  </span>
                </div>

                <div className="text-muted-foreground">
                  {format(new Date(result.date), "MMM d, yyyy")}
                </div>

                <div className="text-muted-foreground">
                  by {result.user.name}
                </div>

                {result.type !== "regular" && (
                  <Badge variant="secondary" className="capitalize">
                    {result.type}
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-2xl font-bold">
                {formatCurrencyAmount(result.amount)}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(result.score * 100)}% match
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}


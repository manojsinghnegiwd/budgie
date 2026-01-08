"use client";

import { useState, useCallback, useEffect } from "react";
import { SearchInput } from "./search-input";
import { SearchResults } from "./search-results";
import {
  searchExpenses,
  isSemanticSearchAvailable,
  type SearchResult,
} from "@/app/actions/search";
import { useUser } from "@/components/user-provider";

export function SearchPageClient() {
  const { selectedUserId } = useUser();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"semantic" | "text">("semantic");

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const searchResults = await searchExpenses(searchQuery, {
          userId: selectedUserId,
        });
        setResults(searchResults);

        // Check if semantic search is available
        const isSemanticAvailable = await isSemanticSearchAvailable();
        setSearchMode(isSemanticAvailable ? "semantic" : "text");
      } catch (error) {
        console.error("Error searching:", error);
        setError(
          error instanceof Error ? error.message : "Failed to search expenses"
        );
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedUserId]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  return (
    <div className="space-y-6">
      {/* Floating search controls on mobile, static on desktop */}
      <div className="sticky top-0 md:relative z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:bg-transparent md:backdrop-blur-none -mx-4 px-4 pt-4 pb-4 md:mx-0 md:px-0 md:pt-0 md:pb-0 space-y-4 border-b md:border-0">
        {searchMode === "text" && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">Using Basic Text Search</p>
            <p>
              Semantic search is not available. Using traditional keyword-based
              search instead. To enable AI-powered semantic search, configure
              OPENAI_API_KEY and PINECONE_API_KEY environment variables.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-800 dark:text-red-200">
            <p className="font-medium mb-1">Search Error</p>
            <p>{error}</p>
          </div>
        )}

        <SearchInput
          value={query}
          onChange={setQuery}
          isLoading={isLoading}
          placeholder="e.g., groceries from last month, coffee expenses, etc."
        />
      </div>

      <SearchResults results={results} isLoading={isLoading} query={query} />
    </div>
  );
}


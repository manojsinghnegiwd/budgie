"use client";

import { useState, useCallback, useEffect } from "react";
import { SearchInput } from "./search-input";
import { SearchResults } from "./search-results";
import {
  searchExpenses,
  isSemanticSearchAvailable,
  type SearchResult,
} from "@/app/actions/search";
import type { Category } from "@prisma/client";
import { useUser } from "@/components/user-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchPageClientProps {
  categories: Category[];
}

export function SearchPageClient({ categories }: SearchPageClientProps) {
  const { selectedUserId, users } = useUser();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchUserId, setSearchUserId] = useState<string>("current");
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
        // Determine which userId to use for search
        let userIdFilter: string | null | undefined;
        if (searchUserId === "current") {
          userIdFilter = selectedUserId;
        } else if (searchUserId === "all") {
          userIdFilter = null; // Search all users
        } else {
          userIdFilter = searchUserId; // Specific user
        }

        const searchResults = await searchExpenses(searchQuery, {
          userId: userIdFilter,
          categoryId:
            selectedCategoryId !== "all" ? selectedCategoryId : undefined,
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
    [selectedUserId, selectedCategoryId, searchUserId]
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

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {category.icon && <span>{category.icon}</span>}
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">User</label>
            <Select value={searchUserId} onValueChange={setSearchUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Current user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">
                  Current User ({users.find((u) => u.id === selectedUserId)?.name || "Unknown"})
                </SelectItem>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <SearchResults results={results} isLoading={isLoading} query={query} />
    </div>
  );
}


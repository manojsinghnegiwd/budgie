import { Suspense } from "react";
import { SearchPageClient } from "@/components/search/search-page-client";

export default async function SearchPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 hidden md:block">
        <h1 className="text-3xl font-bold mb-2">Search Expenses</h1>
        <p className="text-muted-foreground">
          Search through your expenses using keywords or natural language
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SearchPageClient />
      </Suspense>
    </div>
  );
}


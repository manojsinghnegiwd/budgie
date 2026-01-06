"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PullToRefresh } from "@/components/pull-to-refresh";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export function DashboardWrapper({ children }: DashboardWrapperProps) {
  const router = useRouter();

  const handleRefresh = useCallback(async () => {
    router.refresh(); // Re-runs all Server Components
  }, [router]);

  // Listen for refresh event from mobile header
  useEffect(() => {
    const handleRefreshEvent = () => {
      handleRefresh();
    };
    window.addEventListener('refresh-page', handleRefreshEvent);
    return () => window.removeEventListener('refresh-page', handleRefreshEvent);
  }, [handleRefresh]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 md:p-8 space-y-6">
        {children}
      </div>
    </PullToRefresh>
  );
}


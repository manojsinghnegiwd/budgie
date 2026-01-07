"use client";

import { useCurrency } from "@/components/currency-provider";
import { useUser } from "@/components/user-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function MobileHeader() {
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const { selectedUserId, setSelectedUserId, users } = useUser();

  const handleRefresh = () => {
    // Trigger a custom event that pages can listen to
    window.dispatchEvent(new CustomEvent('refresh-page'));
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">Budgie</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Select
              value={selectedUserId || ""}
              onValueChange={(value) => {
                setSelectedUserId(value || null);
                router.refresh(); // Refresh the page to re-fetch data with new selected user
              }}
            >
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">₹</SelectItem>
                <SelectItem value="USD">$</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
    </>
  );
}

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

export function MobileHeader() {
  const { currency, setCurrency } = useCurrency();
  const { selectedUserId, setSelectedUserId, users } = useUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card px-4 py-3 md:hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Budgie</h1>
        <div className="flex items-center gap-2">
          <Select
            value={selectedUserId || ""}
            onValueChange={(value) => setSelectedUserId(value || null)}
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
  );
}

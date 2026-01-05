"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrency } from "@/components/currency-provider";
import { useUser } from "@/components/user-provider";
import { getCategories } from "@/app/actions/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tag, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/prisma";

export function MobileHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { currency, setCurrency } = useCurrency();
  const { selectedUserId, setSelectedUserId, users } = useUser();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await getCategories();
      setCategories(cats);
    };
    fetchCategories();
  }, []);

  const handleRefresh = () => {
    // Trigger a custom event that pages can listen to
    window.dispatchEvent(new CustomEvent('refresh-page'));
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCategoriesOpen(true)}
              className="h-8 w-8"
            >
              <Tag className="h-4 w-4" />
            </Button>
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

      {/* Categories Dialog */}
      <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Categories</DialogTitle>
            <DialogDescription>
              Select a category to view details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            {categories.map((category) => {
              const isActive = pathname === `/category/${category.id}`;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    router.push(`/category/${category.id}`);
                    setCategoriesOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-foreground"
                  )}
                >
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.icon && (
                    <span className="text-base leading-none">{category.icon}</span>
                  )}
                  <span className="flex-1 font-medium">{category.name}</span>
                </button>
              );
            })}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories found
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

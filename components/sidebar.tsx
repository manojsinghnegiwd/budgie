"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Receipt, Settings, Tag, ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/lib/prisma";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Search", href: "/search", icon: Search },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const { selectedUserId, setSelectedUserId, users, selectedUser } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Refresh categories when navigating away from settings (in case they were edited)
  useEffect(() => {
    if (pathname !== "/settings") {
      // Small delay to ensure any updates have completed
      const timer = setTimeout(() => {
        loadCategories();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Auto-expand categories if current path is a category page
  useEffect(() => {
    if (pathname?.startsWith("/category/")) {
      setIsCategoriesOpen(true);
    }
  }, [pathname]);

  return (
    <div className="hidden h-screen w-64 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-xl font-bold">Budgie</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
        
        {categories.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className={cn(
                "flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname?.startsWith("/category/")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5" />
                <span>Categories</span>
              </div>
              {isCategoriesOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {isCategoriesOpen && (
              <div className="ml-4 space-y-1 max-h-[300px] overflow-y-auto">
                {categories.map((category) => {
                  const isActive = pathname === `/category/${category.id}`;
                  return (
                    <Link
                      key={category.id}
                      href={`/category/${category.id}`}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors group",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 text-muted-foreground"
                      )}
                    >
                      <div
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.icon && (
                        <span className="text-sm leading-none">{category.icon}</span>
                      )}
                      <span
                        className={cn(
                          "flex-1 text-xs truncate",
                          isActive ? "" : ""
                        )}
                        style={isActive ? {} : { color: category.color }}
                      >
                        {category.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>
      <div className="border-t border-border p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            User
          </label>
          <Select
            value={selectedUserId || ""}
            onValueChange={(value) => {
              setSelectedUserId(value || null);
              router.refresh(); // Refresh the page to re-fetch data with new selected user
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Currency
          </label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}


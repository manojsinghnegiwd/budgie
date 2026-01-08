"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Settings, Plus, Tag, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getCategories } from "@/app/actions/categories";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import type { Category } from "@/lib/prisma";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  // Plus button will be in the middle
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Refresh categories when navigating away from settings (in case they were edited)
  useEffect(() => {
    if (pathname !== "/settings") {
      // Small delay to ensure any updates have completed
      const timer = setTimeout(() => {
        fetchCategories();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Split navigation items for left and right of the plus button
  const leftItems = navigation.slice(0, 2);
  const rightItems = navigation.slice(2);
  
  // Check if we're on a category page
  const isCategoryPage = pathname?.startsWith("/category/");

  return (
    <>
      {/* Floating Search Button */}
      <Link
        href="/search"
        className={cn(
          "fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 md:hidden",
          pathname === "/search" && "bg-primary/90"
        )}
      >
        <Search className="h-6 w-6" />
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {/* Left navigation items */}
          {leftItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Center Plus Button */}
          <div className="flex flex-1 items-center justify-center">
            <button
              onClick={() => setOpen(true)}
              className="flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>

          {/* Categories Button */}
          <button
            onClick={() => setCategoriesOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
              isCategoryPage
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Tag className="h-5 w-5" />
            <span>Categories</span>
          </button>

          {/* Right navigation items */}
          {rightItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Add Expense Dialog - Using full AddExpenseDialog component with tabs */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <AddExpenseDialog 
            categories={categories} 
            open={open}
            onOpenChange={setOpen}
            showTrigger={false}
          />
        </DialogContent>
      </Dialog>

      {/* Categories Dialog */}
      <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogTitle className="mb-4">Categories</DialogTitle>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No categories found
            </p>
          ) : (
            <div className="space-y-1">
              {categories.map((category) => {
                const isActive = pathname === `/category/${category.id}`;
                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.id}`}
                    onClick={() => setCategoriesOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
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
                    <span className="flex-1 truncate">{category.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

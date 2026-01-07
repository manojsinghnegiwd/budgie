"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import type { Category } from "@/lib/prisma";

interface CategoryFilterProps {
  categories: Category[];
  className?: string;
}

export function CategoryFilter({ categories, className }: CategoryFilterProps) {
  const router = useRouter();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("selectedCategories");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSelectedCategoryIds(parsed);
          // Sync to cookie for server-side access
          document.cookie = `selectedCategories=${encodeURIComponent(stored)}; path=/; max-age=31536000; SameSite=Lax`;
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, []);

  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      setSelectedCategoryIds((prev) => {
        const newIds = prev.includes(categoryId)
          ? prev.filter((id) => id !== categoryId)
          : [...prev, categoryId];
        
        // Store in localStorage
        const json = JSON.stringify(newIds);
        localStorage.setItem("selectedCategories", json);
        
        // Sync to cookie for server-side access
        document.cookie = `selectedCategories=${encodeURIComponent(json)}; path=/; max-age=31536000; SameSite=Lax`;
        
        return newIds;
      });
    },
    []
  );

  const handleSelectAll = useCallback(() => {
    const allIds = categories.map((cat) => cat.id);
    const json = JSON.stringify(allIds);
    localStorage.setItem("selectedCategories", json);
    document.cookie = `selectedCategories=${encodeURIComponent(json)}; path=/; max-age=31536000; SameSite=Lax`;
    setSelectedCategoryIds(allIds);
  }, [categories]);

  const handleSelectAllPersonal = useCallback(() => {
    const personalIds = categories.filter((cat) => !cat.isShared).map((cat) => cat.id);
    const newIds = [...new Set([...selectedCategoryIds, ...personalIds])];
    const json = JSON.stringify(newIds);
    localStorage.setItem("selectedCategories", json);
    document.cookie = `selectedCategories=${encodeURIComponent(json)}; path=/; max-age=31536000; SameSite=Lax`;
    setSelectedCategoryIds(newIds);
  }, [categories, selectedCategoryIds]);

  const handleSelectAllShared = useCallback(() => {
    const sharedIds = categories.filter((cat) => cat.isShared).map((cat) => cat.id);
    const newIds = [...new Set([...selectedCategoryIds, ...sharedIds])];
    const json = JSON.stringify(newIds);
    localStorage.setItem("selectedCategories", json);
    document.cookie = `selectedCategories=${encodeURIComponent(json)}; path=/; max-age=31536000; SameSite=Lax`;
    setSelectedCategoryIds(newIds);
  }, [categories, selectedCategoryIds]);

  const handleDeselectAll = useCallback(() => {
    const json = JSON.stringify([]);
    localStorage.setItem("selectedCategories", json);
    document.cookie = `selectedCategories=${encodeURIComponent(json)}; path=/; max-age=31536000; SameSite=Lax`;
    setSelectedCategoryIds([]);
  }, []);

  const handleApply = useCallback(() => {
    setOpen(false);
    router.refresh(); // Re-runs all Server Components
  }, [router]);

  const isAllSelected = selectedCategoryIds.length === categories.length && categories.length > 0;
  const isNoneSelected = selectedCategoryIds.length === 0;

  // Separate categories into personal and shared
  const personalCategories = categories.filter((cat) => !cat.isShared);
  const sharedCategories = categories.filter((cat) => cat.isShared);

  const getDisplayText = () => {
    if (isNoneSelected || isAllSelected) {
      return "All Categories";
    }
    if (selectedCategoryIds.length === 1) {
      const category = categories.find((c) => c.id === selectedCategoryIds[0]);
      return category?.name || "1 category";
    }
    return `${selectedCategoryIds.length} categories`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className}>
          <Filter className="h-4 w-4 mr-2" />
          {getDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 max-w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filter by Category</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-7 text-xs"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="h-7 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {/* Personal Categories Section */}
            {personalCategories.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Personal Categories
                  </h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllPersonal}
                    className="h-6 text-xs px-2"
                  >
                    Select All
                  </Button>
                </div>
                <div className="space-y-1">
                  {personalCategories.map((category) => {
                    const isChecked = selectedCategoryIds.includes(category.id);
                    return (
                      <div
                        key={category.id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={isChecked}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <Label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shared Categories Section */}
            {sharedCategories.length > 0 && (
              <div className="space-y-2">
                {personalCategories.length > 0 && (
                  <div className="border-t border-border pt-2" />
                )}
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Shared Categories
                  </h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllShared}
                    className="h-6 text-xs px-2"
                  >
                    Select All
                  </Button>
                </div>
                <div className="space-y-1">
                  {sharedCategories.map((category) => {
                    const isChecked = selectedCategoryIds.includes(category.id);
                    return (
                      <div
                        key={category.id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={isChecked}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <Label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


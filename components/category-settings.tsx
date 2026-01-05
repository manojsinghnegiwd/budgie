"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddCategoryDialog } from "@/components/add-category-dialog";
import { EditCategoryDialog } from "@/components/edit-category-dialog";
import { deleteCategory } from "@/app/actions/categories";
import { useUser } from "@/components/user-provider";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/lib/prisma";

interface CategorySettingsProps {
  categories: Category[];
}

export function CategorySettings({ categories: initialCategories }: CategorySettingsProps) {
  const { selectedUserId } = useUser();
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category? This will also delete all associated expenses.")) {
      await deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  const handleCategoryAdded = (category: Category) => {
    setCategories([...categories, category]);
    setIsAdding(false);
  };

  const handleCategoryUpdated = (updatedCategory: Category) => {
    setCategories(
      categories.map((c) =>
        c.id === updatedCategory.id ? updatedCategory : c
      )
    );
    setEditingCategory(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Manage your expense categories.
            </CardDescription>
          </div>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories yet. Add your first category to get started!
            </p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  {category.icon && <span className="text-xl">{category.icon}</span>}
                  <Badge
                    style={{
                      backgroundColor: category.color + "20",
                      color: category.color,
                      borderColor: category.color,
                    }}
                  >
                    {category.name}
                  </Badge>
                  {category.isShared && (
                    <Badge variant="secondary" className="text-xs">
                      Shared
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      {isAdding && (
        <AddCategoryDialog
          open={isAdding}
          onOpenChange={setIsAdding}
          onCategoryAdded={handleCategoryAdded}
          selectedUserId={selectedUserId}
        />
      )}
      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          onCategoryUpdated={handleCategoryUpdated}
          selectedUserId={selectedUserId}
        />
      )}
    </Card>
  );
}


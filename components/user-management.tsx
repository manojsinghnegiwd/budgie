"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddUserDialog } from "@/components/add-user-dialog";
import { deleteUser } from "@/app/actions/users";
import { useUser } from "@/components/user-provider";
import { Plus, Trash2 } from "lucide-react";
import type { User } from "@/lib/prisma";

export function UserManagement() {
  const [isAdding, setIsAdding] = useState(false);
  const { users, selectedUserId, setSelectedUserId, addUserToState, removeUserFromState } = useUser();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user? This will also delete all associated expenses and budgets.")) {
      try {
        await deleteUser(id);
        removeUserFromState(id);
        
        // If the deleted user was selected, select another user or clear selection
        if (selectedUserId === id) {
          const remainingUsers = users.filter((u) => u.id !== id);
          if (remainingUsers.length > 0) {
            setSelectedUserId(remainingUsers[0].id);
          } else {
            setSelectedUserId(null);
          }
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleUserAdded = (user: User) => {
    addUserToState(user);
    setIsAdding(false);
    // Optionally select the newly added user
    setSelectedUserId(user.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Add and manage users in your application.
            </CardDescription>
          </div>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No users yet. Add your first user to get started!
            </p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between rounded-lg border border-border p-3 ${
                  selectedUserId === user.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{user.name}</p>
                    {selectedUserId === user.id && (
                      <p className="text-xs text-muted-foreground">Currently selected</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(user.id)}
                    disabled={users.length === 1}
                    title={users.length === 1 ? "Cannot delete the last user" : "Delete user"}
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
        <AddUserDialog
          open={isAdding}
          onOpenChange={setIsAdding}
          onUserAdded={handleUserAdded}
        />
      )}
    </Card>
  );
}


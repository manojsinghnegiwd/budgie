"use client";

import { useUser } from "@/components/user-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserViewFilterProps {
  className?: string;
}

export function UserViewFilter({ className }: UserViewFilterProps) {
  const { viewUserId, setViewUserId, selectedUserId, users } = useUser();

  // Resolve the display value - default to selectedUserId if viewUserId is null
  const getDisplayValue = () => {
    if (viewUserId === "all") return "all";
    if (viewUserId === null) {
      // Default to selectedUserId if available, otherwise "all"
      return selectedUserId || "all";
    }
    return viewUserId;
  };

  const handleValueChange = (value: string) => {
    if (value === "all") {
      setViewUserId("all");
    } else {
      setViewUserId(value);
    }
    // No need to refresh - client components will react to context changes
  };

  return (
    <Select value={getDisplayValue()} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select view" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Users</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


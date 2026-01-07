"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@prisma/client";

type UserContextType = {
  selectedUserId: string | null;
  setSelectedUserId: (userId: string | null) => void;
  viewUserId: string | null | "all";
  setViewUserId: (userId: string | null | "all") => void;
  users: User[];
  selectedUser: User | null;
  updateUserInState: (updatedUser: User) => void;
  addUserToState: (user: User) => void;
  removeUserFromState: (userId: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  initialUsers,
  initialUserId,
}: {
  children: React.ReactNode;
  initialUsers: User[];
  initialUserId?: string | null;
}) {
  const [selectedUserId, setSelectedUserIdState] = useState<string | null>(
    initialUserId || null
  );
  const [viewUserId, setViewUserIdState] = useState<string | null | "all">(null);
  const [users, setUsers] = useState<User[]>(initialUsers);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem("selectedUserId");
    let effectiveSelectedUserId: string | null = null;
    
    if (stored && users.some((u) => u.id === stored)) {
      setSelectedUserIdState(stored);
      effectiveSelectedUserId = stored;
      // Sync to cookie for server-side access
      document.cookie = `selectedUserId=${stored}; path=/; max-age=31536000; SameSite=Lax`;
    } else if (users.length > 0 && !stored) {
      // If no stored user but users exist, select first one
      const firstUserId = users[0].id;
      setSelectedUserIdState(firstUserId);
      effectiveSelectedUserId = firstUserId;
      // Sync to cookie and localStorage
      localStorage.setItem("selectedUserId", firstUserId);
      document.cookie = `selectedUserId=${firstUserId}; path=/; max-age=31536000; SameSite=Lax`;
    } else if (stored) {
      effectiveSelectedUserId = stored;
    }

    // Load viewUserId from localStorage on mount
    const storedViewUserId = localStorage.getItem("viewUserId");
    if (storedViewUserId === "all") {
      setViewUserIdState("all");
      document.cookie = `viewUserId=all; path=/; max-age=31536000; SameSite=Lax`;
    } else if (storedViewUserId && users.some((u) => u.id === storedViewUserId)) {
      setViewUserIdState(storedViewUserId);
      document.cookie = `viewUserId=${storedViewUserId}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      // Default to selectedUserId if available, otherwise null (will be resolved to selectedUserId)
      setViewUserIdState(effectiveSelectedUserId);
      if (effectiveSelectedUserId) {
        document.cookie = `viewUserId=${effectiveSelectedUserId}; path=/; max-age=31536000; SameSite=Lax`;
      } else {
        document.cookie = `viewUserId=; path=/; max-age=0`;
      }
    }
  }, [users]);

  const setSelectedUserId = (userId: string | null) => {
    setSelectedUserIdState(userId);
    if (userId) {
      localStorage.setItem("selectedUserId", userId);
      // Also set cookie for server-side access
      document.cookie = `selectedUserId=${userId}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      localStorage.removeItem("selectedUserId");
      document.cookie = "selectedUserId=; path=/; max-age=0";
    }
  };

  const setViewUserId = (userId: string | null | "all") => {
    setViewUserIdState(userId);
    if (userId === "all") {
      localStorage.setItem("viewUserId", "all");
      document.cookie = `viewUserId=all; path=/; max-age=31536000; SameSite=Lax`;
    } else if (userId) {
      localStorage.setItem("viewUserId", userId);
      document.cookie = `viewUserId=${userId}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      localStorage.removeItem("viewUserId");
      document.cookie = "viewUserId=; path=/; max-age=0";
    }
  };

  const updateUserInState = (updatedUser: User) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
  };

  const addUserToState = (user: User) => {
    setUsers((prevUsers) => [...prevUsers, user]);
  };

  const removeUserFromState = (userId: string) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  return (
    <UserContext.Provider
      value={{
        selectedUserId,
        setSelectedUserId,
        viewUserId,
        setViewUserId,
        users,
        selectedUser,
        updateUserInState,
        addUserToState,
        removeUserFromState,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}


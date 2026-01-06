"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@prisma/client";

type UserContextType = {
  selectedUserId: string | null;
  setSelectedUserId: (userId: string | null) => void;
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
  const [users, setUsers] = useState<User[]>(initialUsers);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem("selectedUserId");
    if (stored && users.some((u) => u.id === stored)) {
      setSelectedUserIdState(stored);
      // Sync to cookie for server-side access
      document.cookie = `selectedUserId=${stored}; path=/; max-age=31536000; SameSite=Lax`;
    } else if (users.length > 0 && !stored) {
      // If no stored user but users exist, select first one
      const firstUserId = users[0].id;
      setSelectedUserIdState(firstUserId);
      // Sync to cookie and localStorage
      localStorage.setItem("selectedUserId", firstUserId);
      document.cookie = `selectedUserId=${firstUserId}; path=/; max-age=31536000; SameSite=Lax`;
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


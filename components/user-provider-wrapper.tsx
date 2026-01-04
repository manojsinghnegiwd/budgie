import { getUsers } from "@/app/actions/users";
import { UserProvider } from "./user-provider";

export async function UserProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const users = await getUsers();

  return (
    <UserProvider initialUsers={users}>
      {children}
    </UserProvider>
  );
}


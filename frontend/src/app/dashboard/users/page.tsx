// src/app/dashboard/users/page.tsx
import { UserList } from "@/components/users/user-list";

const UsersPage = () => {
  return (
    <div className="container mx-auto py-6">
      <UserList />
    </div>
  );
};

export default UsersPage;

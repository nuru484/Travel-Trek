// src/components/users/user-list.tsx
"use client";
import { useState } from "react";
import { useGetAllUsersQuery } from "@/redux/userApi";
import { UserRole } from "@/types/user.types";
import { useDebounce } from "../../hooks/useDebounce";

export function UserList() {
  const [page] = useState(1);
  const [limit] = useState(20);
  const [roleFilter] = useState<UserRole | "ALL">("ALL");
  const [searchTerm] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: usersData } = useGetAllUsersQuery({
    page,
    limit,
    role: roleFilter === "ALL" ? undefined : roleFilter,
    search: debouncedSearch || undefined,
  });

  console.log("All users: ", usersData);

  return <div>User list</div>;
}

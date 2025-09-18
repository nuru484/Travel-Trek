// src/components/users/table/UserActionsDropdown.tsx
"use client";
import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Trash2, Shield, User } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IUser, UserRole } from "@/types/user.types";
import {
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} from "@/redux/userApi";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface UserActionsDropdownProps {
  user: IUser;
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null);

  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  const handleChangeRole = async () => {
    if (!selectedRole) return;

    const toastId = toast.loading(`Changing role to ${selectedRole}...`);

    try {
      await updateUserRole({ userId: user.id, role: selectedRole }).unwrap();
      toast.dismiss(toastId);
      toast.success(`User role changed to ${selectedRole} successfully`);
      setRoleDialogOpen(false);
      setSelectedRole(null);
    } catch (error) {
      const { message } = extractApiErrorMessage(error);
      toast.dismiss(toastId);
      toast.error(message);
    }
  };

  const handleDeleteUser = async () => {
    const toastId = toast.loading("Deleting user...");

    try {
      await deleteUser(user.id).unwrap();
      toast.dismiss(toastId);
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      const { message } = extractApiErrorMessage(error);
      toast.dismiss(toastId);
      toast.error(message);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:cursor-pointer">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* View User Details */}
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/users/${user.id}/user-profile`}
              className="hover:cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="hover:cursor-pointer"
            onClick={() => {
              setRoleDialogOpen(true);
              setSelectedRole(user.role === "ADMIN" ? "CUSTOMER" : "ADMIN");
            }}
          >
            <Shield className="mr-2 h-4 w-4" />
            {user.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="hover:cursor-pointer"
            onClick={() => {
              setRoleDialogOpen(true);
              setSelectedRole(user.role === "AGENT" ? "CUSTOMER" : "AGENT");
            }}
          >
            <Shield className="mr-2 h-4 w-4" />
            {user.role === "AGENT" ? "Remove Agent" : "Make Agent"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-red-600 hover:cursor-pointer"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete "${user.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteUser}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />

      <ConfirmationDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        title="Change User Role"
        description={`Are you sure you want to change the role of "${user.name}" to ${selectedRole}?`}
        onConfirm={handleChangeRole}
        confirmText="Change Role"
        cancelText="Cancel"
      />
    </>
  );
}

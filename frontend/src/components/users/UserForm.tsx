// src/components/users/UserForm.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useUpdateUserProfileMutation } from "@/redux/userApi";
import { IUserResponse } from "@/types/user.types";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { useCreateUserMutation } from "@/redux/userApi";

const UserRole = {
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
  AGENT: "AGENT",
} as const;

type UserRole = (typeof UserRole)[keyof typeof UserRole];

const userFormSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "CUSTOMER", "AGENT"], {
    message: "Select a role",
  }),
  profilePicture: z.any().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface IUserFormProps {
  mode: "create" | "edit";
  user?: IUserResponse["data"];
}

export default function UserForm({ mode, user }: IUserFormProps) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.profilePicture || null
  );

  const [registerUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] =
    useUpdateUserProfileMutation();

  const defaultValues: Partial<UserFormValues> = useMemo(
    () => ({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      password: "",
      role: user?.role as UserRole,
      profilePicture: undefined,
    }),
    [user]
  );

  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      mode === "create"
        ? userFormSchema.extend({
            password: z
              .string()
              .min(4, "Password is required and must be at least 4 characters"),
          })
        : userFormSchema
    ),
    defaultValues,
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onChange(file);
    } else {
      setPreviewUrl(null);
      onChange(null);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl && !user?.profilePicture) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl, user?.profilePicture]);

  const onSubmit = async (values: UserFormValues) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      if (values.phone) formData.append("phone", values.phone);
      if (values.address) formData.append("address", values.address);
      if (values.password) formData.append("password", values.password);
      formData.append("role", values.role);
      if (values.profilePicture)
        formData.append("profilePicture", values.profilePicture);

      if (mode === "create") {
        await registerUser(formData).unwrap();
        toast.success("User created successfully");
      } else {
        await updateUser({
          userId: user!.id,
          data: values,
        }).unwrap();
        toast.success("User updated successfully");
      }

      router.push("/dashboard/users");
    } catch (error) {
      console.error(error);
      toast.error(extractApiErrorMessage(error).message || "Operation failed");
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto">
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+233 54 648 8115" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Main Street, City, Region"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === "create" && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create a strong password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(UserRole).map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profilePicture"
                render={({ field: { onChange, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Profile Picture (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, onChange)}
                        />

                        {(previewUrl || user?.profilePicture) && (
                          <div className="mt-2">
                            <Image
                              src={previewUrl || user?.profilePicture || ""}
                              alt="Profile preview"
                              className="h-24 w-24 object-cover rounded-full border border-input"
                              width={96}
                              height={96}
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/users")}
                  disabled={isLoading}
                  className="flex-1 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 cursor-pointer"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {mode === "create" ? "Create User" : "Update User"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// src/app/login/page.tsx
"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginFormSchema,
  ILoginFormSchema,
} from "@/validation/auth-validation";
import LoginForm from "@/components/authentication/LoginForm";
import { z } from "zod";
import toast from "react-hot-toast";
import { useLoginMutation } from "@/redux/auth/authApi";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { useRouter } from "next/navigation";
import Header from "@/components/index/Header";

export default function LoginPage() {
  const router = useRouter();

  const [loginUser, { isLoading }] = useLoginMutation();

  const form = useForm<ILoginFormSchema>({
    resolver: zodResolver(loginFormSchema),
  });

  async function onSubmit(data: z.infer<typeof loginFormSchema>) {
    try {
      await loginUser(data).unwrap();
      toast.success("Login Successful");
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      const { message, fieldErrors, hasFieldErrors } =
        extractApiErrorMessage(err);

      if (hasFieldErrors && fieldErrors) {
        // Apply field errors to the form
        Object.entries(fieldErrors).forEach(([field, errorMessage]) => {
          form.setError(field as keyof ILoginFormSchema, {
            message: errorMessage,
          });
        });
      }

      // Always show toast with the main message
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header at the top */}
      <Header />

      {/* Main content area */}
      <div className="flex flex-col justify-center items-center p-4 min-h-[calc(100vh-theme(spacing.16))]">
        {/* Main form container */}
        <div className="relative w-full max-w-md">
          {/* Card wrapper */}
          <div className="bg-card border border-border rounded-xl shadow-lg p-8">
            {/* Header section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-card-foreground mb-2">
                Welcome Back
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in to your account to continue
              </p>
            </div>

            {/* Form section */}
            <div className="space-y-6">
              <LoginForm
                form={form}
                onSubmit={onSubmit}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Footer decoration */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Secure login protected by industry-standard encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

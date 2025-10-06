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
import { Button } from "@/components/ui/button";
import { User, UserCog, Shield } from "lucide-react";

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
        Object.entries(fieldErrors).forEach(([field, errorMessage]) => {
          form.setError(field as keyof ILoginFormSchema, {
            message: errorMessage,
          });
        });
      }

      toast.error(message);
    }
  }

  const handleDemoLogin = async (role: "customer" | "agent" | "admin") => {
    const credentials = {
      customer: {
        email: process.env.NEXT_PUBLIC_DEMO_CUSTOMER_EMAIL || "",
        password: process.env.NEXT_PUBLIC_DEMO_CUSTOMER_PASSWORD || "",
      },
      agent: {
        email: process.env.NEXT_PUBLIC_DEMO_AGENT_EMAIL || "",
        password: process.env.NEXT_PUBLIC_DEMO_AGENT_PASSWORD || "",
      },
      admin: {
        email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || "",
        password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || "",
      },
    };

    const selectedCredentials = credentials[role];

    if (!selectedCredentials.email || !selectedCredentials.password) {
      toast.error(`Demo ${role} credentials not configured`);
      return;
    }

    form.setValue("email", selectedCredentials.email);
    form.setValue("password", selectedCredentials.password);

    await onSubmit(selectedCredentials);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header at the top */}
      <Header />

      {/* Main content area */}
      <div className="flex flex-col justify-center items-center p-4 min-h-[calc(100vh-theme(spacing.16))]">
        {/* Main form container */}
        <div className="relative w-full max-w-md">
          {/* Card wrapper */}
          <div className="bg-card border border-border rounded-xl shadow-lg p-3 md:p-6">
            {/* Header section */}
            <div className="text-center mb-8">
              <p className="text-muted-foreground text-sm">
                Sign in to continue
              </p>
            </div>

            {/* Demo Login Section */}
            <div className="mb-8 p-1 md:p-2 lg:p-4 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-3 text-center">
                Quick Demo Access
              </p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin("customer")}
                  disabled={isLoading}
                  className="w-full cursor-pointer justify-start gap-2 bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">Login as Customer</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin("agent")}
                  disabled={isLoading}
                  className="w-full cursor-pointer justify-start gap-2 bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <UserCog className="h-4 w-4" />
                  <span className="text-sm">Login as Agent</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin("admin")}
                  disabled={isLoading}
                  className="w-full cursor-pointer justify-start gap-2 bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Login as Admin</span>
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
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

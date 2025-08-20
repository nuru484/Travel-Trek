// src/app/signup/page.tsx
"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import toast from "react-hot-toast";
import SignupForm from "@/components/authentication/SignupForm";
import {
  ISignupFormSchema,
  signupFormSchema,
} from "@/validation/auth-validation";
import { useRegisterUserMutation } from "@/redux/auth/authApi";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";

export default function SignupPage() {
  const router = useRouter();

  const [registerUser, { isLoading }] = useRegisterUserMutation();

  const form = useForm<ISignupFormSchema>({
    resolver: zodResolver(signupFormSchema),
  });

  async function onSubmit(data: z.infer<typeof signupFormSchema>) {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("role", data.role);
      formData.append("phone", data.phone);
      if (data.address) formData.append("address", data.address);
      if (data.profilePicture)
        formData.append("profilePicture", data.profilePicture);

      await registerUser(formData).unwrap();
      toast.success("Signup Successful");
      router.push("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      const apiError = extractApiErrorMessage(err);
      toast.error(apiError || "Signup Failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>

      {/* Main form container */}
      <div className="relative w-full max-w-lg">
        {/* Card wrapper */}
        <div className="bg-card border border-border rounded-xl shadow-lg p-8">
          {/* Header section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-card-foreground mb-2">
              Create Account
            </h1>
            <p className="text-muted-foreground text-sm">
              Join our platform to get started
            </p>
          </div>

          {/* Form section */}
          <div className="space-y-6">
            <SignupForm form={form} onSubmit={onSubmit} isLoading={isLoading} />
          </div>
        </div>

        {/* Footer decoration */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

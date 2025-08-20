"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { ILoginFormSchema } from "@/validation/auth-validation";
import { UseFormReturn } from "react-hook-form";

interface LoginFormContentProps {
  form: UseFormReturn<ILoginFormSchema>;
  onSubmit: (data: ILoginFormSchema) => Promise<void>;
  isLoading: boolean;
  triggerProps?: React.ComponentProps<typeof Button>;
}

export default function LoginForm({
  form,
  onSubmit,
  isLoading,
}: LoginFormContentProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = async (data: ILoginFormSchema) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="w-full space-y-5"
        >
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-card-foreground font-medium">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="your.email@example.com"
                    type="email"
                    className="bg-muted/50 border-input focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-destructive text-xs" />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-card-foreground font-medium">
                    Password
                  </FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="bg-muted/50 border-input focus:border-ring focus:ring-1 focus:ring-ring transition-colors pr-12"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-destructive text-xs" />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 shadow-sm"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

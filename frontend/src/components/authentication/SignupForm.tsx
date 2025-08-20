// src/components/authentication/SignupForm.tsx
"use client";
import React, { useEffect } from "react";
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
import { ISignupFormSchema } from "@/validation/auth-validation";
import { UseFormReturn } from "react-hook-form";
import Image from "next/image";

interface SignupFormContentProps {
  form: UseFormReturn<ISignupFormSchema>;
  onSubmit: (data: ISignupFormSchema) => Promise<void>;
  isLoading: boolean;
  triggerProps?: React.ComponentProps<typeof Button>;
}

export default function SignupForm({
  form,
  onSubmit,
  isLoading,
}: SignupFormContentProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const handleSubmit = async (data: ISignupFormSchema) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview URL for the selected image
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
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="w-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="w-full space-y-5"
        >
          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-card-foreground font-medium">
                  Full Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your full name"
                    className="bg-muted/50 border-input focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-destructive text-xs" />
              </FormItem>
            )}
          />

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

          {/* Phone Field */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-card-foreground font-medium">
                  Phone Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="+233 54 648 8115"
                    type="tel"
                    className="bg-muted/50 border-input focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-destructive text-xs" />
              </FormItem>
            )}
          />

          {/* Address Field */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-card-foreground font-medium">
                  Address
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="123 Main Street, City, Region"
                    className="bg-muted/50 border-input focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-destructive text-xs" />
              </FormItem>
            )}
          />

          {/* Profile Picture Field */}
          <FormField
            control={form.control}
            name="profilePicture"
            render={({ field: { onChange, value, ...fieldProps } }) => (
              <FormItem>
                <FormLabel className="text-card-foreground font-medium">
                  Profile Picture
                  <span className="text-muted-foreground text-xs ml-1">
                    (Optional)
                  </span>
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="bg-muted/50 border-input focus:border-ring focus:ring-1 focus:ring-ring transition-colors file:text-muted-foreground file:bg-transparent file:border-0"
                      onChange={(e) => handleFileChange(e, onChange)}
                    />
                    {previewUrl && (
                      <div className="mt-2">
                        <Image
                          src={previewUrl}
                          alt="Profile preview"
                          className="h-24 w-24 object-cover rounded-full border border-input"
                          width={96}
                          height={96}
                        />
                      </div>
                    )}
                  </div>
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
                <FormLabel className="text-card-foreground font-medium">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
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

          {/* Hidden role field */}
          <input type="hidden" value="CUSTOMER" {...form.register("role")} />

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
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

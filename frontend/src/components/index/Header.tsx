import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";
import Image from "next/image";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  <Image
                    src="/logo.png"
                    alt="Travel Trek Logo"
                    width={800}
                    height={600}
                  />
                </span>
              </div>
              <span className="font-bold text-xl text-foreground">
                Travel Trek
              </span>
            </Link>
          </div>

          {/* Contact Details - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>+(233)546488115</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>abdulmajeednurudeen47@gmail.com</span>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Contact Details */}
        <div className="md:hidden pb-3 flex items-center justify-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Phone className="h-3 w-3" />
            <span>+(233)546488115</span>
          </div>
          <div className="flex items-center space-x-1">
            <Mail className="h-3 w-3" />
            <span>abdulmajeednurudeen47@gmail.com</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

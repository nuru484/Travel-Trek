import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";
import Image from "next/image";
import ModeToggleButton from "../ModeToggleButton";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center min-w-0 flex-shrink-0">
            <Link
              href="/"
              className="flex items-center space-x-1.5 sm:space-x-2"
            >
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <div className="relative w-full h-full">
                  <Image
                    src="/logo.png"
                    alt="Travel Trek Logo"
                    fill
                    className="object-contain p-0.5"
                  />
                </div>
              </div>
              <span className="font-bold text-base sm:text-xl text-foreground whitespace-nowrap">
                Travel Trek
              </span>
            </Link>
          </div>

          {/* Contact Details - Hidden on mobile and tablet */}
          <div className="hidden lg:flex items-center space-x-6 text-sm text-muted-foreground">
            <a
              href="tel:+233546488115"
              className="flex items-center space-x-2 hover:text-foreground transition-colors"
            >
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">+(233) 546 488 115</span>
            </a>
            <a
              href="mailto:abdulmajeednurudeen47@gmail.com"
              className="flex items-center space-x-2 hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">
                abdulmajeednurudeen47@gmail.com
              </span>
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground h-8 sm:h-9 px-2 sm:px-4 text-sm"
            >
              <Link href="/login">Login</Link>
            </Button>
            <ModeToggleButton />
          </div>
        </div>

        {/* Mobile/Tablet Contact Details */}
        <div className="lg:hidden pb-2 sm:pb-3 flex flex-col xs:flex-row items-center justify-center gap-2 xs:gap-4 text-[10px] xs:text-xs text-muted-foreground">
          <a
            href="tel:+233546488115"
            className="flex items-center space-x-1 hover:text-foreground transition-colors"
          >
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="whitespace-nowrap">+(233) 546 488 115</span>
          </a>
          <a
            href="mailto:abdulmajeednurudeen47@gmail.com"
            className="flex items-center space-x-1 hover:text-foreground transition-colors truncate max-w-[250px] xs:max-w-none"
          >
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">abdulmajeednurudeen47@gmail.com</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;

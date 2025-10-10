"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";
import Image from "next/image";
import ModeToggleButton from "../ModeToggleButton";
import { motion } from "framer-motion";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-lg shadow-md border-border"
          : "bg-background/80 backdrop-blur-md border-border/50"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center min-w-0 flex-shrink-0"
          >
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              <div className="relative h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <div className="relative w-full h-full">
                  <Image
                    src="/logo.png"
                    alt="Travel Trek Logo"
                    fill
                    className="object-contain p-1"
                    priority
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg md:text-xl text-foreground whitespace-nowrap group-hover:text-primary transition-colors duration-200">
                  Travel Trek
                </span>
                <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                  Explore the World
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Contact Details - Desktop Only */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden lg:flex items-center gap-6 text-sm"
          >
            <a
              href="tel:+233546488115"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200 group"
            >
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-200">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <span className="whitespace-nowrap font-medium">
                +(233) 546 488 115
              </span>
            </a>

            <a
              href="mailto:abdulmajeednurudeen47@gmail.com"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200 group"
            >
              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors duration-200">
                <Mail className="h-4 w-4 text-accent" />
              </div>
              <span className="whitespace-nowrap font-medium">
                abdulmajeednurudeen47@gmail.com
              </span>
            </a>
          </motion.div>

          {/* Auth & Theme Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-2 md:gap-3 flex-shrink-0"
          >
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-9 md:h-10 px-3 md:px-4 text-sm font-medium"
            >
              <Link href="/login">Login</Link>
            </Button>

            <Button
              size="sm"
              asChild
              className="hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 h-9 md:h-10 px-4 md:px-6 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Link href="/signup">Get Started</Link>
            </Button>

            <ModeToggleButton />
          </motion.div>
        </div>

        {/* Mobile/Tablet Contact Bar - Below main header */}
        <div className="lg:hidden border-t border-border/50 py-2.5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs">
            <a
              href="tel:+233546488115"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors duration-200 group"
            >
              <div className="p-1 bg-primary/10 rounded group-hover:bg-primary/20 transition-colors duration-200">
                <Phone className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="whitespace-nowrap font-medium">
                +(233) 546 488 115
              </span>
            </a>

            <div className="hidden sm:block w-px h-4 bg-border/50" />

            <a
              href="mailto:abdulmajeednurudeen47@gmail.com"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors duration-200 max-w-[280px] group"
            >
              <div className="p-1 bg-accent/10 rounded group-hover:bg-accent/20 transition-colors duration-200">
                <Mail className="h-3.5 w-3.5 text-accent flex-shrink-0" />
              </div>
              <span className="truncate font-medium">
                abdulmajeednurudeen47@gmail.com
              </span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

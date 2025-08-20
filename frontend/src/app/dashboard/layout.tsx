// src/app/dashboard/layout.tsx
import type * as React from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import ProtectRoutes from "@/components/authentication/ProtectRoutes";
import ModeToggleButton from "@/components/ModeToggleButton";
import LogoutButton from "@/components/authentication/LogoutButton";

interface AgriLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: AgriLayoutProps) {
  return (
    <ProtectRoutes>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <header className="flex h-16 items-center justify-between border-b px-4">
            <SidebarTrigger className="mr-2" />

            <div className="flex gap-2">
              <ModeToggleButton />
              <LogoutButton />
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectRoutes>
  );
}

"use client";

import { LogoutButton } from "@/components/layout/LogoutButton";
import { cn } from "@/lib/utils";
import { type ComponentPropsWithoutRef } from "react";
import { Logo } from "./Logo";
import { MainNav } from "./MainNav";

interface SidebarProps extends ComponentPropsWithoutRef<"aside"> {
  onNavigate?: () => void;
  onLogout?: () => Promise<void> | void;
}

interface SidebarContentProps {
  onNavigate?: () => void;
  onLogout?: () => Promise<void> | void;
}

export function Sidebar({ className, onNavigate, onLogout, ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-64 md:flex-col",
        className
      )}
      {...props}
    >
      <SidebarContent onNavigate={onNavigate} onLogout={onLogout} />
    </aside>
  );
}

export function SidebarContent({ onNavigate, onLogout }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <MainNav onNavigate={onNavigate} />
      </div>
      <div className="border-t border-sidebar-border px-3 py-4">
        <LogoutButton onLogout={onLogout} />
      </div>
    </div>
  );
}

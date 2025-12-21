"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface LogoutButtonProps {
  onLogout?: () => Promise<void> | void;
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  const t = useTranslations("layout.logout");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    if (!onLogout) {
      toast.info(t("placeholder"));
      return;
    }

    setIsLoading(true);
    startTransition(async () => {
      try {
        await onLogout();
      } catch (error) {
        console.error("Failed to logout", error);
        toast.error(t("error"));
      } finally {
        setIsLoading(false);
      }
    });
  };

  const loading = isLoading || isPending;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start gap-2"
      onClick={handleLogout}
      disabled={loading}
      aria-busy={loading}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span>{loading ? t("actions.loggingOut") : t("actions.logout")}</span>
    </Button>
  );
}

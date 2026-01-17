"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <div role="status" aria-live="polite" aria-label="Powiadomienia aplikacji">
      <SonnerToaster
        position="top-right"
        richColors
        expand={false}
        closeButton
        className="toaster group"
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border",
            description: "group-[.toast]:text-muted-foreground",
            actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          },
        }}
      />
    </div>
  );
}

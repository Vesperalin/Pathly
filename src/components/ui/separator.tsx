import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const Separator = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("h-px w-full bg-border", className)} {...props} />;
  }
);

Separator.displayName = "Separator";

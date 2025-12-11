import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface DashboardHeaderProps {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export function DashboardHeader({ title, description, ctaLabel, ctaHref }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Button asChild size="lg">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </header>
  );
}

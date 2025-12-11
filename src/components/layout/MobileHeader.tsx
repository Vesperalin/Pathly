"use client";

import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Breadcrumbs } from "./BreadcrumbsContext";
import { Logo } from "./Logo";
import { SidebarContent } from "./Sidebar";

interface MobileHeaderProps {
  breadcrumbsSlot?: ReactNode;
}

export function MobileHeader({ breadcrumbsSlot }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const translation = useTranslations("layout.mobileHeader");
  const { items } = useBreadcrumbs();
  const headerContent = breadcrumbsSlot ?? (items.length > 0 ? <Breadcrumbs /> : <Logo />);

  return (
    <header className="flex h-16 items-center gap-3 border-b border-border bg-background px-4 py-3 md:hidden">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label={isOpen ? translation("closeSideNavigation") : translation("openSideNavigation")}
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[280px] p-0">
          <VisuallyHidden>
            <DialogTitle>{translation("menu")}</DialogTitle>
          </VisuallyHidden>
          <VisuallyHidden>
            <DialogDescription>{translation("menuDescription")}</DialogDescription>
          </VisuallyHidden>
          <SidebarContent onNavigate={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
      <div className="flex flex-1 items-center justify-center truncate">{headerContent}</div>
    </header>
  );
}

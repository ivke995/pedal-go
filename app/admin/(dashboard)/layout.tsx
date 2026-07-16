import type { ReactNode } from "react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { requireAuthenticatedAdmin } from "@/lib/admin-auth/auth";
import { cn } from "@/lib/utils";

import { logoutAdmin } from "../actions";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAuthenticatedAdmin();
  const navItems = [
    { href: "/admin", label: "Summary" },
    { href: "/admin/reservations", label: "Reservations" },
    { href: "/admin/pricing", label: "Pricing" },
    { href: "/admin/availability", label: "Availability" },
    { href: "/admin/calendar", label: "Calendar" },
    { href: "/admin/reports", label: "Reports" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo />
              <div>
                <p className="text-sm font-medium text-muted-foreground">PedalGo Admin</p>
                <p className="text-lg font-semibold">Operations dashboard</p>
              </div>
            </div>
            <form action={logoutAdmin} className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">{admin.name ?? admin.email}</span>
              <Button type="submit" variant="outline">
                Log out
              </Button>
            </form>
          </div>
          <nav aria-label="Admin dashboard" className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0")}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

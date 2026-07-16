import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { requireAuthenticatedAdmin } from "@/lib/admin-auth/auth";

import { logoutAdmin } from "../actions";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAuthenticatedAdmin();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">PedalGo Admin</p>
            <p className="text-lg font-semibold">Operations dashboard</p>
          </div>
          <form action={logoutAdmin} className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{admin.name ?? admin.email}</span>
            <Button type="submit" variant="outline">
              Log out
            </Button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}

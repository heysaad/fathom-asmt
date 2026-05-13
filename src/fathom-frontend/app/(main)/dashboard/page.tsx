"use client";

import { useEffect } from "react";
import { Loader2Icon } from "lucide-react";

import { useUser } from "@/app/lib/user-context";
import AdminDashboard from "./components/admin-dashboard";
import CrewDashboardView from "./components/crew-dashboard";

export default function Page() {
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading || user) return;

    const returnUrl = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.role == "crew") {
    return <CrewDashboardView />;
  }

  return <AdminDashboard />;
}

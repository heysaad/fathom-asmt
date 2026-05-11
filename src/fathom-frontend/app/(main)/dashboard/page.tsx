"use client";

import { Loader2Icon } from "lucide-react";

import { useUser } from "@/app/lib/user-context";
import AdminDashboard from "./components/admin-dashboard";
import CrewDashboardView from "./components/crew-dashboard";

export default function Page() {
  const { user, loading } = useUser();

  if (loading) {
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

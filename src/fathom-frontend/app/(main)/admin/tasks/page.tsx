import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminTasksTable } from "../components/admin-tasks-table";

export default function AdminTasksPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Admin tasks
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Maintenance tasks
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review maintenance work across the fleet, filter by status or due
            date, and open records for updates.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/ships">Manage ships</Link>
        </Button>
      </div>

      <AdminTasksTable />
    </div>
  );
}

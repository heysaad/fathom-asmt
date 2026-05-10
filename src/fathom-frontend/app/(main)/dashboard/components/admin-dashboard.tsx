"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangleIcon,
  CalendarCheckIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "lucide-react";

import apiClient from "@/app/lib/api-client";
import { PaginationTable } from "@/components/paginationTable";
import { Button } from "@/components/ui/button";
import { FromCalendar } from "@/components/libs/moment";
import ShipImg from "../../ships/components/shipImg";
import type { Drill, MaintenanceRecord, ShipVM } from "../../ships/models";
import { StatusBadge } from "@/components/ui/badge";
import { DashboardHeader, MetricCard } from "./dashboard-utils";
import type { PagedResponse } from "./dashboard-utils";

type AdminSummary = {
  complianceScore: number;
  openTasks: number;
  overdueTasks: number;
  missedDrills: number;
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary>({
    complianceScore: 0,
    openTasks: 0,
    overdueTasks: 0,
    missedDrills: 0,
  });

  const loadSummary = useCallback(async () => {
    const now = new Date().toISOString();
    const [
      shipsResponse,
      scheduledTasks,
      inProgressTasks,
      overdueScheduledTasks,
      overdueInProgressTasks,
      missedDrills,
    ] = await Promise.all([
      apiClient.get<ShipVM[]>("/ships"),
      apiClient.post<PagedResponse<MaintenanceRecord>>("/tasks/paginated", {
        page: 1,
        pageSize: 1,
        filters: { status: "scheduled" },
      }),
      apiClient.post<PagedResponse<MaintenanceRecord>>("/tasks/paginated", {
        page: 1,
        pageSize: 1,
        filters: { status: "in_progress" },
      }),
      apiClient.post<PagedResponse<MaintenanceRecord>>("/tasks/paginated", {
        page: 1,
        pageSize: 1,
        filters: { status: "scheduled", dateTo: now },
      }),
      apiClient.post<PagedResponse<MaintenanceRecord>>("/tasks/paginated", {
        page: 1,
        pageSize: 1,
        filters: { status: "in_progress", dateTo: now },
      }),
      apiClient.post<PagedResponse<Drill>>("/drills/paginated", {
        page: 1,
        pageSize: 1,
        filters: { status: "missed" },
      }),
    ]);

    const complianceScore = shipsResponse.data.length
      ? Math.round(
          shipsResponse.data.reduce(
            (total, ship) => total + (ship.compliance_score ?? 0),
            0,
          ) / shipsResponse.data.length,
        )
      : 0;

    setSummary({
      complianceScore,
      openTasks: scheduledTasks.data.total + inProgressTasks.data.total,
      overdueTasks:
        overdueScheduledTasks.data.total + overdueInProgressTasks.data.total,
      missedDrills: missedDrills.data.total,
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSummary();
  }, [loadSummary]);

  const taskColumns = [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => (
        <div className="max-w-72">
          <p className="font-medium">{row.original.title}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {row.original.type}
          </p>
        </div>
      ),
    },
    {
      header: "Ship",
      cell: ({ row }) => (
        <Link
          href={`/ships/${row.original.ship_id}`}
          className="flex min-w-48 items-center gap-2"
        >
          {row.original.ship_id && (
            <ShipImg id={row.original.ship_id} className="size-8 rounded-lg border" />
          )}
          <span className="min-w-0">
            <span className="block truncate">{row.original.ship?.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {row.original.ship?.type}
            </span>
          </span>
        </Link>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due",
      cell: ({ row }) =>
        row.original.dueDate ? <FromCalendar date={row.original.dueDate} /> : "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ] as ColumnDef<MaintenanceRecord>[];

  const drillColumns = [
    {
      accessorKey: "title",
      header: "Drill",
      cell: ({ row }) => (
        <div className="max-w-72">
          <p className="font-medium">
            {row.original.title ?? row.original.type.replaceAll("_", " ")}
          </p>
          <p className="text-xs capitalize text-muted-foreground">
            {row.original.type.replaceAll("_", " ")}
          </p>
        </div>
      ),
    },
    {
      header: "Ship",
      cell: ({ row }) => (
        <Link
          href={`/ships/${row.original.ship_id}`}
          className="flex min-w-48 items-center gap-2"
        >
          <ShipImg id={row.original.ship_id} className="size-8 rounded-lg border" />
          <span className="min-w-0">
            <span className="block truncate">{row.original.ship?.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {row.original.ship?.type}
            </span>
          </span>
        </Link>
      ),
    },
    {
      accessorKey: "scheduled_at",
      header: "Scheduled",
      cell: ({ row }) => <FromCalendar date={row.original.scheduled_at} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ] as ColumnDef<Drill>[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <DashboardHeader
        eyebrow="Admin dashboard"
        title="Fleet overview"
        description="A quick look at fleet workload and safety follow-up."
        actionHref="/admin/tasks"
        actionLabel="View all tasks"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Compliance score"
          value={`${summary.complianceScore}%`}
          helper="Average across ships"
          icon={<ShieldCheckIcon className="size-5" />}
          tone={summary.complianceScore >= 80 ? "green" : "amber"}
        />
        <MetricCard
          title="Open tasks"
          value={summary.openTasks}
          helper="Scheduled or in progress"
          icon={<WrenchIcon className="size-5" />}
          tone={summary.openTasks ? "blue" : "green"}
        />
        <MetricCard
          title="Overdue tasks"
          value={summary.overdueTasks}
          helper="Past due and not completed"
          icon={<AlertTriangleIcon className="size-5" />}
          tone={summary.overdueTasks ? "red" : "green"}
        />
        <MetricCard
          title="Missed drills"
          value={summary.missedDrills}
          helper="Need admin review"
          icon={<AlertTriangleIcon className="size-5" />}
          tone={summary.missedDrills ? "red" : "green"}
        />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Open maintenance</h2>
            <p className="text-sm text-muted-foreground">
              Use operations for deeper filtering and editing.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/tasks">All tasks</Link>
          </Button>
        </div>
        <PaginationTable
          url="/tasks/paginated"
          columns={taskColumns}
          filters={{ status: "scheduled" }}
          initialPageSize={5}
        />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Scheduled drills</h2>
            <p className="text-sm text-muted-foreground">
              The next drill records across the fleet.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/drills">All drills</Link>
          </Button>
        </div>
        <PaginationTable
          url="/drills/paginated"
          columns={drillColumns}
          filters={{ status: "scheduled" }}
          initialPageSize={5}
          headerLeft={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarCheckIcon className="size-4" />
              Scheduled
            </div>
          }
        />
      </div>
    </div>
  );
}

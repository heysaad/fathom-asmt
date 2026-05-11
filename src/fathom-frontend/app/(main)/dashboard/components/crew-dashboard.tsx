"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangleIcon,
  CalendarCheckIcon,
  CalendarIcon,
  ListTodoIcon,
  ShieldCheckIcon,
} from "lucide-react";

import apiClient from "@/app/lib/api-client";
import { useUser } from "@/app/lib/user-context";
import { PaginationTable } from "@/components/paginationTable";
import { Button } from "@/components/ui/button";
import { FromCalendar } from "@/components/libs/moment";
import { TaskDueDate } from "@/components/app/taskDueDate";
import ShipImg from "../../ships/components/shipImg";
import type { DrillAssignment, MaintenanceRecord } from "../../ships/models";
import { DashboardHeader, MetricCard } from "./dashboard-utils";
import type { PagedResponse } from "./dashboard-utils";
import {
  DrillStatusBadge,
  TaskStatusBadge,
} from "@/components/app/drillStatusBadge";
import EditTaskDialog from "../../maintainance/components/editTaskDialog";
import { TaskCell } from "../../tasks/page";

type CrewSummary = {
  complianceScore: number;
  openTasks: number;
  overdueTasks: number;
  upcomingDrills: number;
};

export default function CrewDashboardView() {
  const { user } = useUser();
  const [summary, setSummary] = useState<CrewSummary>({
    complianceScore: 0,
    openTasks: 0,
    overdueTasks: 0,
    upcomingDrills: 0,
  });
  const [openEditTask, setOpenEditTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceRecord>();

  const loadSummary = useCallback(async () => {
    const now = new Date().toISOString();
    const [
      scheduledTasks,
      inProgressTasks,
      completedTasks,
      overdueScheduledTasks,
      overdueInProgressTasks,
      upcomingDrills,
      completedDrills,
      missedDrills,
    ] = await Promise.all([
      apiClient.post<PagedResponse<MaintenanceRecord>>("/tasks/my-tasks", {
        page: 1,
        pageSize: 1,
        filters: { status: "scheduled" },
      }),
      apiClient.post<PagedResponse<MaintenanceRecord>>("/tasks/my-tasks", {
        page: 1,
        pageSize: 1,
        filters: { status: "in_progress" },
      }),
      apiClient.post<PagedResponse<MaintenanceRecord>>("/tasks/my-tasks", {
        page: 1,
        pageSize: 1,
        filters: { status: "completed" },
      }),
      apiClient.post<PagedResponse<MaintenanceRecord>>("/tasks/my-tasks", {
        page: 1,
        pageSize: 1,
        filters: { status: "scheduled", dateTo: now },
      }),
      apiClient.post<PagedResponse<MaintenanceRecord>>("/tasks/my-tasks", {
        page: 1,
        pageSize: 1,
        filters: { status: "in_progress", dateTo: now },
      }),
      apiClient.post<PagedResponse<DrillAssignment>>("/drills/my-drills", {
        page: 1,
        pageSize: 1,
        filters: { status: "scheduled" },
      }),
      apiClient.post<PagedResponse<DrillAssignment>>("/drills/my-drills", {
        page: 1,
        pageSize: 1,
        filters: { status: "completed" },
      }),
      apiClient.post<PagedResponse<DrillAssignment>>("/drills/my-drills", {
        page: 1,
        pageSize: 1,
        filters: { status: "missed" },
      }),
    ]);

    const completed = completedTasks.data.total + completedDrills.data.total;
    const total =
      scheduledTasks.data.total +
      inProgressTasks.data.total +
      completedTasks.data.total +
      upcomingDrills.data.total +
      completedDrills.data.total +
      missedDrills.data.total;

    setSummary({
      complianceScore: total ? Math.round((completed / total) * 100) : 0,
      openTasks: scheduledTasks.data.total + inProgressTasks.data.total,
      overdueTasks:
        overdueScheduledTasks.data.total + overdueInProgressTasks.data.total,
      upcomingDrills: upcomingDrills.data.total,
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
        <TaskCell
          task={row.original}
          setOpen={setOpenEditTask}
          setTask={setSelectedTask}
        >
          <p className="font-medium truncate">{row.original.title}</p>
          <div className="flex gap-1 items-center whitespace-nowrap text-xs">
            <CalendarIcon className="size-3 text-muted-foreground" />{" "}
            <TaskDueDate task={row.original} />
            <div className="text-xs capitalize text-muted-foreground">
              {" "}
              • {row.original.type}
            </div>
          </div>
        </TaskCell>
      ),
    },
    {
      header: "Ship",
      cell: ({ row }) => (
        <Link
          href={`/ships/${row.original.ship_id}?tab=tasks`}
          className="flex min-w-48 items-center gap-2"
        >
          {row.original.ship_id && (
            <ShipImg
              id={row.original.ship_id}
              className="size-8 rounded-lg border"
            />
          )}
          <span className="truncate">{row.original.ship?.name}</span>
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <TaskStatusBadge task={row.original} />,
    },
  ] as ColumnDef<MaintenanceRecord>[];

  const drillColumns = [
    {
      accessorKey: "title",
      header: "Drill",
      cell: ({ row }) => (
        <Link href={"/drills"} className="max-w-72">
          <p className="font-medium">
            {row.original.drill?.title ??
              row.original.drill?.type.replaceAll("_", " ")}
          </p>
          {row.original.drill && (
            <div className="flex gap-1 items-center text-xs">
              <CalendarIcon className="size-3 text-muted-foreground" />{" "}
              <FromCalendar date={row.original.drill.scheduled_at} />
              <span className="text-xs capitalize text-muted-foreground">
                {" "}
                • {row.original.drill?.type.replaceAll("_", " ")}
              </span>
              {row.original.is_attended && (
                <>
                  {" "}
                  • <span className="text-green-500">Attended</span>
                </>
              )}
            </div>
          )}
        </Link>
      ),
    },
    {
      header: "Ship",
      cell: ({ row }) => (
        <Link
          href={`/ships/${row.original.drill?.ship_id}?tab=drills`}
          className="flex min-w-48 items-center gap-2"
        >
          {row.original.drill?.ship_id && (
            <ShipImg
              id={row.original.drill.ship_id}
              className="size-8 rounded-lg border"
            />
          )}
          <span className="truncate">{row.original.drill?.ship?.name}</span>
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <>
          {row.original.drill && (
            <DrillStatusBadge drill={row.original.drill} />
          )}
        </>
      ),
    },
  ] as ColumnDef<DrillAssignment>[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <DashboardHeader
        eyebrow="Crew dashboard"
        title={`My work${user?.name ? `, ${user.name}` : ""}`}
        description="A simple view of assigned maintenance and upcoming drills."
        actionHref="/tasks"
        actionLabel="Open task page"
      />

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Compliance score"
          value={`${summary.complianceScore}%`}
          helper="Tasks and drills completed"
          icon={<ShieldCheckIcon className="size-5" />}
          tone={summary.complianceScore >= 80 ? "green" : "amber"}
        />
        <MetricCard
          title="Open tasks"
          value={summary.openTasks}
          helper="Scheduled or in progress"
          icon={<ListTodoIcon className="size-5" />}
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
          title="Upcoming drills"
          value={summary.upcomingDrills}
          helper="Scheduled attendance"
          icon={<CalendarCheckIcon className="size-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4 min-w-0">
          <PaginationTable
            url="/tasks/my-tasks"
            headerLeft={
              <div>
                <h2 className="font-medium mt-2">My open tasks</h2>
              </div>
            }
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href="/tasks">All tasks</Link>
              </Button>
            }
            columns={taskColumns}
            filters={{ status: "open" }}
            initialPageSize={5}
          />
        </div>

        <div className="rounded-lg border bg-card p-4 min-w-0">
          <PaginationTable
            url="/drills/my-drills"
            headerLeft={
              <div>
                <h2 className="font-medium mt-2">My upcoming drills</h2>
              </div>
            }
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href="/drills">All drills</Link>
              </Button>
            }
            columns={drillColumns}
            filters={{ status: "open" }}
            initialPageSize={5}
          />
        </div>
      </div>

      <EditTaskDialog
        open={openEditTask}
        setOpen={setOpenEditTask}
        data={selectedTask}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react";

import apiClient from "@/app/lib/api-client";
import { useUser } from "@/app/lib/user-context";
import { Button } from "@/components/ui/button";
import type { DrillAssignment, MaintenanceRecord } from "../../ships/models";
import {
  DashboardHeader,
  EmptyState,
  MetricCard,
  ProgressBar,
  SectionCard,
  StatusBadge,
  dashboardIcons,
  formatShortDate,
  isPastDue,
} from "./dashboard-utils";
import type { PagedResponse } from "./dashboard-utils";

export default function CrewDashboardView() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<MaintenanceRecord[]>([]);
  const [drills, setDrills] = useState<DrillAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const [taskResponse, drillResponse] = await Promise.all([
        apiClient.post<PagedResponse<MaintenanceRecord>>("/tasks/my-tasks", {
          page: 1,
          pageSize: 100,
          filters: {},
        }),
        apiClient.post<PagedResponse<DrillAssignment>>("/drills/my-drills", {
          page: 1,
          pageSize: 100,
          filters: {},
        }),
      ]);

      setTasks(taskResponse.data.data);
      setDrills(drillResponse.data.data);
    } catch {
      setError("Unable to load your dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.status === "completed");
    const openTasks = tasks.filter((task) => task.status !== "completed");
    const overdueTasks = openTasks.filter((task) => isPastDue(task.dueDate));
    const attendedDrills = drills.filter((drill) => drill.is_attended);
    const missedDrills = drills.filter(
      (drill) =>
        !drill.is_attended &&
        (drill.drill?.status === "missed" ||
          isPastDue(drill.drill?.scheduled_at)),
    );
    const upcomingDrills = drills.filter(
      (drill) =>
        !drill.is_attended &&
        drill.drill?.status !== "completed" &&
        !isPastDue(drill.drill?.scheduled_at),
    );
    const complianceTotal = tasks.length + drills.length;
    const complianceDone = completedTasks.length + attendedDrills.length;
    const compliance = complianceTotal
      ? Math.round((complianceDone / complianceTotal) * 100)
      : 0;

    return {
      attendedDrills,
      completedTasks,
      compliance,
      missedDrills,
      openTasks,
      overdueTasks,
      upcomingDrills,
    };
  }, [drills, tasks]);

  const priorityTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.status !== "completed")
        .sort(
          (a, b) =>
            new Date(a.dueDate ?? 0).getTime() -
            new Date(b.dueDate ?? 0).getTime(),
        )
        .slice(0, 6),
    [tasks],
  );

  const drillQueue = useMemo(
    () =>
      drills
        .filter((assignment) => assignment.drill?.status !== "completed")
        .sort(
          (a, b) =>
            new Date(a.drill?.scheduled_at ?? 0).getTime() -
            new Date(b.drill?.scheduled_at ?? 0).getTime(),
        )
        .slice(0, 6),
    [drills],
  );

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <DashboardHeader
        eyebrow="Crew dashboard"
        title={`Welcome aboard${user?.name ? `, ${user.name}` : ""}`}
        description="Track assigned maintenance, drill attendance, upcoming ship activities, and your personal compliance posture."
        actionHref="/tasks"
        actionLabel="Open my tasks"
      />

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCwIcon className="size-4" />
            Retry
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Personal compliance"
          value={`${summary.compliance}%`}
          helper={`${summary.completedTasks.length + summary.attendedDrills.length} activities closed`}
          icon={dashboardIcons.progress}
          tone={summary.compliance >= 80 ? "green" : "amber"}
        />
        <MetricCard
          title="Open tasks"
          value={summary.openTasks.length}
          helper={`${summary.overdueTasks.length} overdue`}
          icon={dashboardIcons.tasks}
          tone={summary.overdueTasks.length ? "red" : "blue"}
        />
        <MetricCard
          title="Upcoming drills"
          value={summary.upcomingDrills.length}
          helper={`${summary.attendedDrills.length} attended`}
          icon={dashboardIcons.drills}
          tone="slate"
        />
        <MetricCard
          title="Attention needed"
          value={summary.overdueTasks.length + summary.missedDrills.length}
          helper="Overdue or missed activities"
          icon={dashboardIcons.alerts}
          tone={
            summary.overdueTasks.length + summary.missedDrills.length
              ? "red"
              : "green"
          }
        />
      </div>

      <SectionCard title="Activity completion">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Maintenance tasks</span>
              <span className="font-medium">
                {summary.completedTasks.length}/{tasks.length}
              </span>
            </div>
            <ProgressBar
              value={
                tasks.length
                  ? Math.round((summary.completedTasks.length / tasks.length) * 100)
                  : 0
              }
              className="mt-3"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Drill attendance</span>
              <span className="font-medium">
                {summary.attendedDrills.length}/{drills.length}
              </span>
            </div>
            <ProgressBar
              value={
                drills.length
                  ? Math.round((summary.attendedDrills.length / drills.length) * 100)
                  : 0
              }
              className="mt-3"
            />
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Priority maintenance"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/tasks">
                All tasks
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          }
        >
          {priorityTasks.length ? (
            <div className="divide-y">
              {priorityTasks.map((task) => (
                <Link
                  key={task.id}
                  href="/tasks"
                  className="grid gap-3 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[1fr_auto]"
                >
                  <span>
                    <span className="block font-medium">{task.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {task.ship?.name ?? "Assigned ship"} - due{" "}
                      {formatShortDate(task.dueDate)}
                    </span>
                  </span>
                  <StatusBadge
                    status={task.status}
                    overdue={task.status !== "completed" && isPastDue(task.dueDate)}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No open maintenance"
              helper="Assigned tasks will appear here when they need action."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Drill queue"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/drills">
                My drills
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          }
        >
          {drillQueue.length ? (
            <div className="divide-y">
              {drillQueue.map((assignment) => (
                <Link
                  key={assignment.id}
                  href="/drills"
                  className="grid gap-3 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[1fr_auto]"
                >
                  <span>
                    <span className="block font-medium">
                      {assignment.drill?.title ??
                        assignment.drill?.type.replaceAll("_", " ")}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {assignment.drill?.ship?.name ?? "Assigned ship"} -{" "}
                      {formatShortDate(assignment.drill?.scheduled_at)}
                    </span>
                  </span>
                  {assignment.is_attended ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                      <CheckIcon className="size-3" />
                      Attended
                    </span>
                  ) : (
                    <StatusBadge
                      status={assignment.drill?.status}
                      overdue={isPastDue(assignment.drill?.scheduled_at)}
                    />
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No pending drills"
              helper="Upcoming drill assignments will appear here."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

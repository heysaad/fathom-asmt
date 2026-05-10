"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";

import apiClient from "@/app/lib/api-client";
import type { Drill, MaintenanceRecord, ShipVM } from "../../ships/models";
import { Button } from "@/components/ui/button";
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
  scoreTone,
} from "./dashboard-utils";
import type { PagedResponse } from "./dashboard-utils";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [ships, setShips] = useState<ShipVM[]>([]);
  const [tasks, setTasks] = useState<MaintenanceRecord[]>([]);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const shipsResponse = await apiClient.get<ShipVM[]>("/ships");
      const taskResponse = await apiClient.post<PagedResponse<MaintenanceRecord>>(
        "/tasks/paginated",
        { page: 1, pageSize: 100, filters: {} },
      );

      const drillResponses = await Promise.all(
        shipsResponse.data.map((ship) =>
          apiClient
            .post<PagedResponse<Drill>>(`/ships/${ship.id}/drills/list`, {
              page: 1,
              pageSize: 50,
              filters: {},
            })
            .then((response) => response.data.data)
            .catch(() => [] as Drill[]),
        ),
      );

      setShips(shipsResponse.data);
      setTasks(taskResponse.data.data);
      setDrills(drillResponses.flat());
    } catch {
      setError("Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const overdueTasks = tasks.filter(
      (task) => task.status !== "completed" && isPastDue(task.dueDate),
    );
    const missedDrills = drills.filter(
      (drill) =>
        drill.status === "missed" ||
        (drill.status !== "completed" && isPastDue(drill.scheduled_at)),
    );
    const completedTasks = tasks.filter((task) => task.status === "completed");
    const completedDrills = drills.filter((drill) => drill.status === "completed");
    const averageCompliance =
      ships.length > 0
        ? Math.round(
            ships.reduce((sum, ship) => sum + (ship.compliance_score ?? 0), 0) /
              ships.length,
          )
        : 0;

    return {
      averageCompliance,
      completedDrills,
      completedTasks,
      missedDrills,
      overdueTasks,
      pendingTasks: tasks.filter((task) => task.status !== "completed"),
      totalDrills: drills.length,
      totalTasks: tasks.length,
    };
  }, [drills, ships, tasks]);

  const fleetRisk = useMemo(() => {
    return ships
      .slice()
      .sort((a, b) => (a.compliance_score ?? 0) - (b.compliance_score ?? 0))
      .slice(0, 5);
  }, [ships]);

  const exceptionFeed = useMemo(() => {
    const taskExceptions = summary.overdueTasks.map((task) => ({
      id: task.id,
      title: task.title,
      detail: `${task.ship?.name ?? "Ship"} maintenance due ${formatShortDate(task.dueDate)}`,
      href: task.ship_id ? `/ships/${task.ship_id}` : "/tasks",
      status: task.status,
      overdue: true,
      type: "Maintenance",
    }));

    const drillExceptions = summary.missedDrills.map((drill) => ({
      id: drill.id,
      title: drill.title ?? drill.type.replaceAll("_", " "),
      detail: `${drill.ship?.name ?? "Ship"} drill scheduled ${formatShortDate(drill.scheduled_at)}`,
      href: drill.ship_id ? `/ships/${drill.ship_id}` : "/drills",
      status: drill.status,
      overdue: drill.status !== "missed",
      type: "Safety Drill",
    }));

    return [...taskExceptions, ...drillExceptions].slice(0, 8);
  }, [summary.missedDrills, summary.overdueTasks]);

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
        eyebrow="Admin dashboard"
        title="Fleet compliance command center"
        description="Monitor ship readiness, overdue maintenance, missed drills, and the lowest-scoring vessels from one operational surface."
        actionHref="/ships"
        actionLabel="Manage ships"
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
          title="Fleet compliance"
          value={`${summary.averageCompliance}%`}
          helper={`${ships.length} ships monitored`}
          icon={dashboardIcons.progress}
          tone={summary.averageCompliance >= 80 ? "green" : "amber"}
        />
        <MetricCard
          title="Open maintenance"
          value={summary.pendingTasks.length}
          helper={`${summary.overdueTasks.length} overdue tasks`}
          icon={dashboardIcons.tasks}
          tone={summary.overdueTasks.length ? "red" : "blue"}
        />
        <MetricCard
          title="Drill exceptions"
          value={summary.missedDrills.length}
          helper={`${summary.completedDrills.length}/${summary.totalDrills} completed`}
          icon={dashboardIcons.drills}
          tone={summary.missedDrills.length ? "red" : "green"}
        />
        <MetricCard
          title="Active vessels"
          value={ships.length}
          helper="Ranked by compliance risk"
          icon={dashboardIcons.ships}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Exceptions needing action"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/tasks">
                Tasks
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          }
        >
          {exceptionFeed.length ? (
            <div className="divide-y">
              {exceptionFeed.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="grid gap-3 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[120px_1fr_auto]"
                >
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.type}
                  </span>
                  <span>
                    <span className="block font-medium">{item.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {item.detail}
                    </span>
                  </span>
                  <StatusBadge status={item.status} overdue={item.overdue} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active exceptions"
              helper="Overdue maintenance and missed drills will appear here."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Fleet risk ranking"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/ships">
                <PlusIcon className="size-4" />
                Ship
              </Link>
            </Button>
          }
        >
          <div className="space-y-4">
            {fleetRisk.map((ship) => {
              const score = ship.compliance_score ?? 0;

              return (
                <Link
                  key={ship.id}
                  href={`/ships/${ship.id}`}
                  className="block rounded-lg border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{ship.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {ship.type ?? "Ship"} {ship.imo ? `- IMO ${ship.imo}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 text-sm font-semibold ring-1",
                        scoreTone(score),
                      )}
                    >
                      {score}%
                    </span>
                  </div>
                  <ProgressBar value={score} className="mt-4" />
                </Link>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Maintenance completion">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completed tasks</span>
              <span className="font-medium">
                {summary.completedTasks.length}/{summary.totalTasks}
              </span>
            </div>
            <ProgressBar
              value={
                summary.totalTasks
                  ? Math.round(
                      (summary.completedTasks.length / summary.totalTasks) * 100,
                    )
                  : 0
              }
            />
          </div>
        </SectionCard>

        <SectionCard title="Safety drill completion">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completed drills</span>
              <span className="font-medium">
                {summary.completedDrills.length}/{summary.totalDrills}
              </span>
            </div>
            <ProgressBar
              value={
                summary.totalDrills
                  ? Math.round(
                      (summary.completedDrills.length / summary.totalDrills) * 100,
                    )
                  : 0
              }
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

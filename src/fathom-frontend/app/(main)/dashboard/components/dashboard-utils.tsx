"use client";

import type React from "react";
import Link from "next/link";
import {
  AlertTriangleIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  Clock3Icon,
  ShieldCheckIcon,
  ShipIcon,
  WrenchIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DashboardStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "missed"
  | "cancelled";

export type PagedResponse<T> = {
  total: number;
  data: T[];
};

export function formatStatus(status?: string) {
  if (!status) return "Unknown";
  return status.replaceAll("_", " ");
}

export function isPastDue(date?: string) {
  return Boolean(date && new Date(date).getTime() < Date.now());
}

export function formatShortDate(date?: string) {
  if (!date) return "Unscheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function scoreTone(score?: number) {
  if (!score) return "text-red-700 bg-red-50 ring-red-200";
  if (score >= 90) return "text-emerald-700 bg-emerald-50 ring-emerald-200";
  if (score >= 70) return "text-amber-700 bg-amber-50 ring-amber-200";
  return "text-red-700 bg-red-50 ring-red-200";
}

export function MetricCard({
  title,
  value,
  helper,
  icon,
  tone = "slate",
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
  tone?: "slate" | "green" | "amber" | "red" | "blue";
}) {
  const toneClass = {
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-sky-50 text-sky-700 ring-sky-200",
  }[tone];

  return (
    <Card size="sm" className="rounded-lg">
      <CardContent className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg ring-1",
            toneClass,
          )}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      aria-label={`${safeValue}% complete`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  helper,
}: {
  title: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <CheckCircle2Icon className="mx-auto size-8 text-emerald-600" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

export function DashboardHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {actionHref && actionLabel && (
        <Button asChild variant="outline">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="flex-row items-center justify-between gap-4 border-b pb-4">
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export const dashboardIcons = {
  alerts: <AlertTriangleIcon className="size-5" />,
  drills: <CalendarCheckIcon className="size-5" />,
  progress: <ShieldCheckIcon className="size-5" />,
  ships: <ShipIcon className="size-5" />,
  tasks: <WrenchIcon className="size-5" />,
  time: <Clock3Icon className="size-5" />,
};

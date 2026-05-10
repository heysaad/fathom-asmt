import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "slate" | "green" | "amber" | "red" | "blue";

const toneClass: Record<BadgeTone, string> = {
  slate: "bg-slate-50 text-slate-700 ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
};

export function Badge({
  className,
  tone = "slate",
  children,
  ...props
}: React.ComponentProps<"span"> & {
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function getStatusTone(status?: string): BadgeTone {
  if (status === "completed" || status === "active") return "green";
  if (status === "in_progress") return "blue";
  if (status === "inactive") return "slate";
  if (status === "missed" || status === "cancelled") {
    return "red";
  }
  return "amber";
}

export function formatBadgeText(value?: string) {
  return value ? value.replaceAll("_", " ") : "unknown";
}

export function StatusBadge({
  status,
  children,
}: {
  status?: string;
  children?: React.ReactNode;
}) {
  return (
    <Badge className="capitalize" tone={getStatusTone(status)}>
      {children ?? formatBadgeText(status)}
    </Badge>
  );
}

export function ScoreBadge({ score }: { score?: number }) {
  const value = score ?? 0;
  const tone: BadgeTone = value >= 90 ? "green" : value >= 70 ? "amber" : "red";

  return <Badge tone={tone}>{value}%</Badge>;
}

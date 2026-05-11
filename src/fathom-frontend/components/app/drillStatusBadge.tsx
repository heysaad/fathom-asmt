import { Drill, MaintenanceRecord } from "@/app/(main)/ships/models";
import { StatusBadge } from "../ui/badge";
import moment from "moment";
import { isTaskOverdue } from "./taskDueDate";

export function DrillStatusBadge({ drill }: { drill: Drill }) {
  let status = drill.status as string;
  if (
    drill.status == "scheduled" &&
    moment(drill.scheduled_at) < moment(new Date())
  )
    status = "overdue";
  return <StatusBadge status={status} />;
}

export function TaskStatusBadge({ task }: { task: MaintenanceRecord }) {
  let status = task.status as string;
  if (isTaskOverdue(task)) status = "overdue";
  return <StatusBadge status={status} />;
}

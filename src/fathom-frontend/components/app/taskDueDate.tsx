import moment from "moment";

import { cn } from "@/lib/utils";

type TaskWithDueDate = {
  dueDate?: string | Date;
  status?: string;
};

export function isTaskOverdue(task: TaskWithDueDate) {
  if (!task.dueDate || task.status === "completed") return false;

  return moment(task.dueDate).isBefore(moment());
}

export function TaskDueDate({
  task,
  format = "calendar",
  className,
}: {
  task: TaskWithDueDate;
  format?: "calendar" | "date";
  className?: string;
}) {
  if (!task.dueDate) return <span>-</span>;

  const overdue = isTaskOverdue(task);
  const dueDate = moment(task.dueDate);
  const label =
    format === "date" ? dueDate.format("DD MMM YYYY") : dueDate.calendar();

  return (
    <span
      className={cn(
        overdue && "font-medium text-red-700 dark:text-red-400",
        className,
      )}
    >
      {label}
    </span>
  );
}

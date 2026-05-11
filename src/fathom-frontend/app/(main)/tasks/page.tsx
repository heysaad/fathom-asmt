"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { FilterIcon, ListTodoIcon } from "lucide-react";

import { TaskDueDate } from "@/components/app/taskDueDate";
import { PaginationTable } from "@/components/paginationTable";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import EditTaskDialog from "../maintainance/components/editTaskDialog";
import ShipImg from "../ships/components/shipImg";
import type { MaintenanceRecord } from "../ships/models";
import { TaskStatusBadge } from "@/components/app/drillStatusBadge";
import { useUser } from "@/app/lib/user-context";
import { canEditTask } from "@/app/lib/permissions";

export function TaskCell({
  task,
  setTask,
  setOpen,
  children
}: {
  task: MaintenanceRecord;
  setTask: (task: MaintenanceRecord) => void;
  setOpen: (open: boolean) => void;
  children?: ReactNode;
}) {
  const { user } = useUser();
  const canEdit = canEditTask(task, user);

  const handleItemClick = () => {
    if (!canEdit) return;
    setTask(task);
    setOpen(true);
  };

  return (
    <div
      onClick={() => canEdit && handleItemClick()}
      className={
        (canEdit ? "cursor-pointer" : "") + " whitespace-normal max-w-48"
      }
    >
      {children || (
        <>
          <span className="block text-xs font-medium capitalize text-muted-foreground">
            {task.type}
          </span>
          <span className="block font-medium">{task.title}</span>
          {task.description && (
            <span className="line-clamp-2 block text-xs text-muted-foreground">
              {task.description}
            </span>
          )}
        </>
      )}
    </div>
  );
}

export default function TasksPage() {
  const [filters, setFilters] = useState<{ status?: string }>({ status: "open" });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshKey, setRefreshkey] = useState(1);
  const [selectedTask, setSelectedTask] = useState<MaintenanceRecord>();

  const columns = [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => (
        <TaskCell
          task={row.original}
          setOpen={setEditModalOpen}
          setTask={setSelectedTask}
        />
      ),
    },
    {
      header: "Ship",
      cell: ({ row }) => (
        <Link
          href={`/ships/${row.original.ship_id}`}
          className="flex min-w-56 items-center gap-2"
        >
          {row.original.ship_id && (
            <ShipImg id={row.original.ship_id} className="size-9 rounded-lg" />
          )}
          <span className="min-w-0">
            <span className="block truncate font-medium">
              {row.original.ship?.name ?? "Ship"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {row.original.ship?.type ?? "Vessel"}
              {row.original.ship?.imo ? ` - IMO ${row.original.ship.imo}` : ""}
            </span>
          </span>
        </Link>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due",
      cell: ({ row }) => <TaskDueDate task={row.original} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <TaskStatusBadge task={row.original} />,
    },
  ] as ColumnDef<MaintenanceRecord>[];

  const reloadData = () => {
    setRefreshkey(refreshKey + 1);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Crew work</p>
          <h1 className="text-2xl font-semibold tracking-tight">My tasks</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Maintenance work assigned to you across vessels.
          </p>
        </div>
      </div>

      <PaginationTable
        key={refreshKey}
        url="/tasks/my-tasks"
        columns={columns}
        filters={filters}
        headerLeft={
          <div className="flex flex-wrap items-center gap-3">
            <ListTodoIcon className="size-4 text-muted-foreground" />
            <FilterIcon className="size-4 opacity-50" />
            <NativeSelect
              value={filters.status}
              onChange={(event) =>
                setFilters({ ...filters, status: event.target.value })
              }
            >
              <NativeSelectOption value="">All statuses</NativeSelectOption>
              <NativeSelectOption value="open">
                Open
              </NativeSelectOption>
              <NativeSelectOption value="scheduled">
                Scheduled
              </NativeSelectOption>
              <NativeSelectOption value="in_progress">
                In Progress
              </NativeSelectOption>
              <NativeSelectOption value="completed">
                Completed
              </NativeSelectOption>
            </NativeSelect>
          </div>
        }
      />

      <EditTaskDialog
        open={editModalOpen}
        setOpen={setEditModalOpen}
        data={selectedTask}
        onSave={reloadData}
      />
    </div>
  );
}

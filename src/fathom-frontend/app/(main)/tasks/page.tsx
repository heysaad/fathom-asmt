"use client";

import Link from "next/link";
import { useState } from "react";
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

export default function TasksPage() {
  const [filters, setFilters] = useState<{ status?: string }>({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshKey, setRefreshkey] = useState(1);
  const [selectedTask, setSelectedTask] = useState<MaintenanceRecord>();

  const handleItemClick = (row: MaintenanceRecord) => {
    setSelectedTask(row);
    setEditModalOpen(true);
  };

  const columns = [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => (
        <button
          onClick={() => handleItemClick(row.original)}
          className="max-w-96 cursor-pointer text-left"
        >
          <span className="block text-xs font-medium capitalize text-muted-foreground">
            {row.original.type}
          </span>
          <span className="block font-medium">{row.original.title}</span>
          {row.original.description && (
            <span className="line-clamp-2 block text-xs text-muted-foreground">
              {row.original.description}
            </span>
          )}
        </button>
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
              <NativeSelectOption value="scheduled">Scheduled</NativeSelectOption>
              <NativeSelectOption value="in_progress">
                In Progress
              </NativeSelectOption>
              <NativeSelectOption value="completed">Completed</NativeSelectOption>
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

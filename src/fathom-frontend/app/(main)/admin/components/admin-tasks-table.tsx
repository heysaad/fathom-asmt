"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { FilterIcon, UserIcon } from "lucide-react";

import { TaskStatusBadge } from "@/components/app/drillStatusBadge";
import { TaskDueDate } from "@/components/app/taskDueDate";
import { PaginationTable } from "@/components/paginationTable";
import { UserInput } from "@/components/user-input";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import EditTaskDialog from "../../maintainance/components/editTaskDialog";
import type { MaintenanceRecord } from "../../ships/models";
import {
  type AdminOperationFilters,
  dateInputValue,
  endOfDayFilter,
  startOfDayFilter,
} from "./admin-operation-filters";
import { ShipCell } from "./ship-cell";
import { ShipFilter } from "./ship-filter";

export function AdminTasksTable() {
  const [filters, setFilters] = useState<AdminOperationFilters>({});
  const [refreshKey, setRefreshKey] = useState(1);
  const [selectedTask, setSelectedTask] = useState<MaintenanceRecord>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns = [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => (
        <button
          className="max-w-80 cursor-pointer text-left"
          onClick={() => {
            setSelectedTask(row.original);
            setDialogOpen(true);
          }}
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
        <ShipCell
          shipId={row.original.ship_id}
          name={row.original.ship?.name}
          type={row.original.ship?.type}
          imo={row.original.ship?.imo}
        />
      ),
    },
    {
      header: "Assigned crew",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <UserIcon className="size-4 text-muted-foreground" />
          <span>{row.original.assignedTo?.name ?? "Not assigned"}</span>
        </div>
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

  return (
    <>
      <PaginationTable
        key={refreshKey}
        url="/tasks/paginated"
        columns={columns}
        filters={filters}
        headerLeft={
          <div className="flex flex-wrap items-center gap-3">
            <FilterIcon className="size-4 opacity-50" />
            <ShipFilter
              value={filters.shipId}
              onValueChange={(shipId) => setFilters({ ...filters, shipId })}
            />
            <UserInput
              includeAll
              allLabel="All crew"
              placeholder="All crew"
              value={filters.userId}
              onValueChange={(userId) => setFilters({ ...filters, userId })}
            />
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
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              From
              <Input
                aria-label="Task due date from"
                className="w-36"
                type="date"
                value={dateInputValue(filters.dateFrom)}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    dateFrom: startOfDayFilter(event.target.value),
                  })
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              To
              <Input
                aria-label="Task due date to"
                className="w-36"
                type="date"
                value={dateInputValue(filters.dateTo)}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    dateTo: endOfDayFilter(event.target.value),
                  })
                }
              />
            </label>
          </div>
        }
      />

      <EditTaskDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        data={selectedTask}
        onSave={() => setRefreshKey((value) => value + 1)}
      />
    </>
  );
}

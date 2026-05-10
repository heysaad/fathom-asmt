"use client";

import Link from "next/link";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { FilterIcon, UserIcon } from "lucide-react";

import { FromCalendar } from "@/components/libs/moment";
import { PaginationTable } from "@/components/paginationTable";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import EditTaskDialog from "../../maintainance/components/editTaskDialog";
import EditDrillDialog from "../../ships/components/editDrillDialog";
import ShipImg from "../../ships/components/shipImg";
import type { Drill, MaintenanceRecord } from "../../ships/models";

type StatusFilter = {
  status?: string;
  drill_type?: string;
  dateFrom?: string;
  dateTo?: string;
};

function startOfDayFilter(value: string) {
  return value ? `${value}T00:00:00` : undefined;
}

function endOfDayFilter(value: string) {
  return value ? `${value}T23:59:59` : undefined;
}

function dateInputValue(value?: string) {
  return value?.slice(0, 10) ?? "";
}

function ShipCell({
  shipId,
  name,
  type,
  imo,
}: {
  shipId?: string;
  name?: string;
  type?: string;
  imo?: string;
}) {
  if (!shipId) return <span className="text-muted-foreground">Unassigned</span>;

  return (
    <Link href={`/ships/${shipId}`} className="flex min-w-52 items-center gap-2">
      <ShipImg id={shipId} className="size-9 rounded-lg" />
      <span className="min-w-0">
        <span className="block truncate font-medium">{name ?? "Ship"}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {type ?? "Vessel"} {imo ? `- IMO ${imo}` : ""}
        </span>
      </span>
    </Link>
  );
}

export function AdminTasksTable() {
  const [filters, setFilters] = useState<StatusFilter>({});
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
      cell: ({ row }) =>
        row.original.dueDate ? <FromCalendar date={row.original.dueDate} /> : "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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

export function AdminDrillsTable() {
  const [filters, setFilters] = useState<StatusFilter>({});
  const [refreshKey, setRefreshKey] = useState(1);
  const [selectedDrill, setSelectedDrill] = useState<Drill>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns = [
    {
      accessorKey: "title",
      header: "Drill",
      cell: ({ row }) => (
        <button
          className="max-w-80 cursor-pointer text-left"
          onClick={() => {
            setSelectedDrill(row.original);
            setDialogOpen(true);
          }}
        >
          <span className="block text-xs font-medium capitalize text-muted-foreground">
            {row.original.type.replaceAll("_", " ")}
          </span>
          <span className="block font-medium">
            {row.original.title ?? row.original.type.replaceAll("_", " ")}
          </span>
          {row.original.notes && (
            <span className="line-clamp-2 block text-xs text-muted-foreground">
              {row.original.notes}
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
      accessorKey: "scheduled_at",
      header: "Scheduled",
      cell: ({ row }) => <FromCalendar date={row.original.scheduled_at} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ] as ColumnDef<Drill>[];

  return (
    <>
      <PaginationTable
        key={refreshKey}
        url="/drills/paginated"
        columns={columns}
        filters={filters}
        headerLeft={
          <div className="flex flex-wrap items-center gap-3">
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
              <NativeSelectOption value="missed">Missed</NativeSelectOption>
              <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
            </NativeSelect>
            <NativeSelect
              value={filters.drill_type}
              onChange={(event) =>
                setFilters({ ...filters, drill_type: event.target.value })
              }
            >
              <NativeSelectOption value="">All drill types</NativeSelectOption>
              <NativeSelectOption value="fire_drill">Fire Drill</NativeSelectOption>
              <NativeSelectOption value="evacuation">Evacuation</NativeSelectOption>
              <NativeSelectOption value="man_overboard">
                Man Overboard
              </NativeSelectOption>
            </NativeSelect>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              From
              <Input
                aria-label="Drill scheduled date from"
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
                aria-label="Drill scheduled date to"
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

      {selectedDrill?.ship_id && (
        <EditDrillDialog
          shipId={selectedDrill.ship_id}
          open={dialogOpen}
          setOpen={setDialogOpen}
          data={selectedDrill}
          onSave={() => setRefreshKey((value) => value + 1)}
        />
      )}
    </>
  );
}

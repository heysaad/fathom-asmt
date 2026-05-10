"use client";

import Link from "next/link";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarCheckIcon,
  FilterIcon,
  ListChecksIcon,
  UserIcon,
} from "lucide-react";

import { PaginationTable } from "@/components/paginationTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FromCalendar } from "@/components/libs/moment";
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

function StatusBadge({ status }: { status?: string }) {
  const tone =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "in_progress"
        ? "bg-sky-50 text-sky-700 ring-sky-200"
        : status === "missed" || status === "cancelled"
          ? "bg-red-50 text-red-700 ring-red-200"
          : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ${tone}`}
    >
      {(status ?? "unknown").replaceAll("_", " ")}
    </span>
  );
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
      <ShipImg id={shipId} className="size-9 rounded-lg border" />
      <span className="min-w-0">
        <span className="block truncate font-medium">{name ?? "Ship"}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {type ?? "Vessel"} {imo ? `- IMO ${imo}` : ""}
        </span>
      </span>
    </Link>
  );
}

export default function AdminOperationsPage() {
  const [taskFilters, setTaskFilters] = useState<StatusFilter>({});
  const [drillFilters, setDrillFilters] = useState<StatusFilter>({});
  const [refreshKey, setRefreshKey] = useState(1);
  const [selectedTask, setSelectedTask] = useState<MaintenanceRecord>();
  const [selectedDrill, setSelectedDrill] = useState<Drill>();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [drillDialogOpen, setDrillDialogOpen] = useState(false);

  const reloadData = () => setRefreshKey((value) => value + 1);

  const taskColumns = [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => (
        <button
          className="max-w-80 cursor-pointer text-left"
          onClick={() => {
            setSelectedTask(row.original);
            setTaskDialogOpen(true);
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

  const drillColumns = [
    {
      accessorKey: "title",
      header: "Drill",
      cell: ({ row }) => (
        <button
          className="max-w-80 cursor-pointer text-left"
          onClick={() => {
            setSelectedDrill(row.original);
            setDrillDialogOpen(true);
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Admin operations
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Tasks and safety drills
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review all maintenance work and safety drills across the fleet,
            filter by status, and open records for updates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/ships">Manage ships</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="gap-4">
        <TabsList>
          <TabsTrigger value="tasks">
            <ListChecksIcon className="size-4" />
            All Tasks
          </TabsTrigger>
          <TabsTrigger value="drills">
            <CalendarCheckIcon className="size-4" />
            All Drills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <PaginationTable
            key={`tasks-${refreshKey}`}
            url="/tasks/paginated"
            columns={taskColumns}
            filters={taskFilters}
            headerLeft={
              <div className="flex flex-wrap items-center gap-3">
                <FilterIcon className="size-4 opacity-50" />
                <NativeSelect
                  value={taskFilters.status}
                  onChange={(event) =>
                    setTaskFilters({
                      ...taskFilters,
                      status: event.target.value,
                    })
                  }
                >
                  <NativeSelectOption value="">All statuses</NativeSelectOption>
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
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  From
                  <Input
                    aria-label="Task due date from"
                    className="w-36"
                    type="date"
                    value={dateInputValue(taskFilters.dateFrom)}
                    onChange={(event) =>
                      setTaskFilters({
                        ...taskFilters,
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
                    value={dateInputValue(taskFilters.dateTo)}
                    onChange={(event) =>
                      setTaskFilters({
                        ...taskFilters,
                        dateTo: endOfDayFilter(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="drills">
          <PaginationTable
            key={`drills-${refreshKey}`}
            url="/drills/paginated"
            columns={drillColumns}
            filters={drillFilters}
            headerLeft={
              <div className="flex flex-wrap items-center gap-3">
                <FilterIcon className="size-4 opacity-50" />
                <NativeSelect
                  value={drillFilters.status}
                  onChange={(event) =>
                    setDrillFilters({
                      ...drillFilters,
                      status: event.target.value,
                    })
                  }
                >
                  <NativeSelectOption value="">All statuses</NativeSelectOption>
                  <NativeSelectOption value="scheduled">
                    Scheduled
                  </NativeSelectOption>
                  <NativeSelectOption value="in_progress">
                    In Progress
                  </NativeSelectOption>
                  <NativeSelectOption value="completed">
                    Completed
                  </NativeSelectOption>
                  <NativeSelectOption value="missed">Missed</NativeSelectOption>
                  <NativeSelectOption value="cancelled">
                    Cancelled
                  </NativeSelectOption>
                </NativeSelect>
                <NativeSelect
                  value={drillFilters.drill_type}
                  onChange={(event) =>
                    setDrillFilters({
                      ...drillFilters,
                      drill_type: event.target.value,
                    })
                  }
                >
                  <NativeSelectOption value="">All drill types</NativeSelectOption>
                  <NativeSelectOption value="fire_drill">
                    Fire Drill
                  </NativeSelectOption>
                  <NativeSelectOption value="evacuation">
                    Evacuation
                  </NativeSelectOption>
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
                    value={dateInputValue(drillFilters.dateFrom)}
                    onChange={(event) =>
                      setDrillFilters({
                        ...drillFilters,
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
                    value={dateInputValue(drillFilters.dateTo)}
                    onChange={(event) =>
                      setDrillFilters({
                        ...drillFilters,
                        dateTo: endOfDayFilter(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
            }
          />
        </TabsContent>
      </Tabs>

      <EditTaskDialog
        open={taskDialogOpen}
        setOpen={setTaskDialogOpen}
        data={selectedTask}
        onSave={reloadData}
      />

      {selectedDrill?.ship_id && (
        <EditDrillDialog
          shipId={selectedDrill.ship_id}
          open={drillDialogOpen}
          setOpen={setDrillDialogOpen}
          data={selectedDrill}
          onSave={reloadData}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { FilterIcon } from "lucide-react";

import { DrillStatusBadge } from "@/components/app/drillStatusBadge";
import { FromCalendar } from "@/components/libs/moment";
import { PaginationTable } from "@/components/paginationTable";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import EditDrillDialog from "../../ships/components/editDrillDialog";
import type { Drill } from "../../ships/models";
import {
  type AdminOperationFilters,
  dateInputValue,
  endOfDayFilter,
  startOfDayFilter,
} from "./admin-operation-filters";
import { ShipCell } from "./ship-cell";
import { ShipFilter } from "./ship-filter";

export function AdminDrillsTable() {
  const [filters, setFilters] = useState<AdminOperationFilters>({});
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
      cell: ({ row }) => <DrillStatusBadge drill={row.original} />,
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
            <ShipFilter
              value={filters.shipId}
              onValueChange={(shipId) => setFilters({ ...filters, shipId })}
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

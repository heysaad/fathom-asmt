"use client";

import Link from "next/link";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarCheckIcon, CheckIcon, FilterIcon } from "lucide-react";
import { toast } from "sonner";

import apiClient from "@/app/lib/api-client";
import { FromCalendar } from "@/components/libs/moment";
import { PaginationTable } from "@/components/paginationTable";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import EditDrillDialog from "../ships/components/editDrillDialog";
import ShipImg from "../ships/components/shipImg";
import type { Drill, DrillAssignment } from "../ships/models";
import { DrillStatusBadge } from "@/components/app/drillStatusBadge";
import { useRouter } from "next/navigation";

export default function DrillsPage() {
  const [filters, setFilters] = useState<{ status?: string }>({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshKey, setRefreshkey] = useState(1);
  const router = useRouter()

  const handleItemClick = (row: DrillAssignment) => {
    router.push(`/ships/${row.drill?.ship_id}?tab=drills`)
  };

  const markAttendance = async (row: DrillAssignment) => {
    await apiClient.put(
      `/ships/${row.drill!.ship_id}/drills/${row.drill_id}/assignments/${row.id}`,
      { is_attended: true },
    );
    reloadData();
    toast.success("Your attendance has been marked");
  };

  const columns = [
    {
      accessorKey: "title",
      header: "Drill",
      cell: ({ row }) => (
        <button
          onClick={() => handleItemClick(row.original)}
          className="max-w-96 cursor-pointer text-left whitespace-normal"
        >
          <span className="block text-xs font-medium capitalize text-muted-foreground">
            {row.original.drill?.type.replaceAll("_", " ")}
          </span>
          <span className="block font-medium">
            {row.original.drill?.title ??
              row.original.drill?.type.replaceAll("_", " ")}
          </span>
          {row.original.drill?.notes && (
            <span className="line-clamp-2 block text-xs text-muted-foreground">
              {row.original.drill.notes}
            </span>
          )}
        </button>
      ),
    },
    {
      header: "Ship",
      cell: ({ row }) => (
        <Link
          href={`/ships/${row.original.drill?.ship_id}`}
          className="flex min-w-56 items-center gap-2"
        >
          {row.original.drill?.ship_id && (
            <ShipImg
              id={row.original.drill.ship_id}
              className="size-9 rounded-lg"
            />
          )}
          <span className="min-w-0">
            <span className="block truncate font-medium">
              {row.original.drill?.ship?.name ?? "Ship"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {row.original.drill?.ship?.type ?? "Vessel"}
              {row.original.drill?.ship?.imo
                ? ` - IMO ${row.original.drill.ship.imo}`
                : ""}
            </span>
          </span>
        </Link>
      ),
    },
    {
      accessorKey: "scheduled_at",
      header: "Scheduled",
      cell: ({ row }) =>
        row.original.drill?.scheduled_at ? (
          <FromCalendar date={row.original.drill.scheduled_at} />
        ) : (
          "-"
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <>
          {row.original.drill && (
            <DrillStatusBadge drill={row.original.drill} />
          )}
        </>
      ),
    },
    {
      accessorKey: "id",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          {row.original.drill?.status == "in_progress" &&
            !row.original.is_attended && (
              <Button size="xs" onClick={() => markAttendance(row.original)}>
                Mark Attendance
              </Button>
            )}
          {row.original.is_attended && (
            <div className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckIcon className="size-4" />
              Attended
            </div>
          )}
        </div>
      ),
    },
  ] as ColumnDef<DrillAssignment>[];

  const reloadData = () => {
    setRefreshkey(refreshKey + 1);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Safety participation
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">My drills</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Safety drills assigned to you and your attendance status.
          </p>
        </div>
      </div>

      <PaginationTable
        key={refreshKey}
        url="/drills/my-drills"
        columns={columns}
        filters={filters}
        headerLeft={
          <div className="flex flex-wrap items-center gap-3">
            <CalendarCheckIcon className="size-4 text-muted-foreground" />
            <FilterIcon className="size-4 opacity-50" />
            <NativeSelect
              value={filters.status}
              onChange={(event) =>
                setFilters({ ...filters, status: event.target.value })
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
          </div>
        }
      />
    </div>
  );
}

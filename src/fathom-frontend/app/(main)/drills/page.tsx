"use client";

import { PaginationTable } from "@/components/paginationTable";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { ColumnDef } from "@tanstack/react-table";
import { CheckIcon, FilterIcon } from "lucide-react";
import { useState } from "react";
import { Drill, DrillAssignment } from "../ships/models";
import ShipImg from "../ships/components/shipImg";
import { FromCalendar } from "@/components/libs/moment";
import EditTaskDialog from "../maintainance/components/editTaskDialog";
import Link from "next/link";
import EditDrillDialog from "../ships/components/editDrillDialog";
import { Button } from "@/components/ui/button";
import apiClient from "@/app/lib/api-client";
import { toast } from "sonner";

export default function DrillsPage() {
  const [filters, setFilters] = useState<{ status?: string }>({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshKey, setRefreshkey] = useState(1);
  const [selected, setSelected] = useState<Drill>();

  const handleItemClick = (row: DrillAssignment) => {
    setSelected(row.drill);
    setEditModalOpen(true);
  };

  const markAttendance = async (row: DrillAssignment) => {
    const response = await apiClient.put(
      `/ships/${row.drill!.ship_id}/drills/${row.drill_id}/assignments/${row.id}`,
      { is_attended: true },
    );
    reloadData()
    toast.success('Your attendance has been marked')
  };

  const columns = [
    {
      accessorKey: "title",
      header: "Drill",
      cell: ({ row }) => (
        <div
          onClick={() => handleItemClick(row.original)}
          className="cursor-pointer"
        >
          <div className="font-bold">{row.original.drill?.title}</div>
          <div>
            {row.original.drill?.scheduled_at && (
              <FromCalendar date={row.original.drill?.scheduled_at} />
            )}
          </div>
          {row.original.drill?.notes && <div>{row.original.drill?.notes}</div>}
        </div>
      ),
    },
    {
      header: "Ship",
      cell: ({ row }) => (
        <Link
          href={`/ships/${row.original.drill?.ship_id}`}
          className="flex gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-1">
            {row.original.drill?.ship_id && (
              <ShipImg
                id={row.original.drill?.ship_id}
                className="size-8 border rounded-lg"
              />
            )}
            <div className="flex-1">
              {row.original.drill?.ship?.name}
              <div className="text-xs text-muted-foreground">
                {row.original.drill?.ship?.type} •{" "}
                {row.original.drill?.ship?.imo}
              </div>
            </div>
          </div>
          <div className="flex-1"></div>
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.drill!.status;
        let color = "gray";
        if (status === "completed") color = "bg-green-100 text-green-800";
        else if (status === "in_progress")
          color = "bg-yellow-100 text-yellow-800";
        else if (status === "scheduled")
          color = "bg-orange-100 text-orange-800";
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
            {status.replace("_", " ").toUpperCase()}
          </span>
        );
      },
    },
    {
      accessorKey: "id",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center">
          {row.original.drill?.status == "in_progress" && (
            <div>
              {!row.original.is_attended && (
                <Button
                  size={"xs"}
                  onClick={() => markAttendance(row.original)}
                >
                  Mark Attendance
                </Button>
              )}
            </div>
          )}
          {row.original.is_attended && (
            <div className="text-green-500 flex gap-1 items-center">
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
    <div className="container max-w-3xl mx-auto">
      <h2 className="page-title mb-4">My Drills</h2>

      <PaginationTable
        key={refreshKey}
        url="/drills/my-drills"
        columns={columns}
        filters={filters}
        headerLeft={
          <div className="flex items-center gap-3">
            <FilterIcon className="size-4 opacity-50" />
            <NativeSelect
              value={filters.status}
              onChange={(x) =>
                setFilters({ ...filters, status: x.target.value })
              }
            >
              <NativeSelectOption value="">All</NativeSelectOption>
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

      {selected?.ship_id && (
        <EditDrillDialog
          shipId={selected.ship_id}
          open={editModalOpen}
          setOpen={setEditModalOpen}
          data={selected}
          onSave={reloadData}
        />
      )}
    </div>
  );
}

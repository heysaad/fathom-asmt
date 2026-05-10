"use client";

import { PaginationTable } from "@/components/paginationTable";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { ColumnDef } from "@tanstack/react-table";
import { FilterIcon } from "lucide-react";
import { useState } from "react";
import { MaintenanceRecord } from "../ships/models";
import ShipImg from "../ships/components/shipImg";
import { FromCalendar, FromNow } from "@/components/libs/moment";
import EditTaskDialog from "../maintainance/components/editTaskDialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DrillsPage() {
  const [filters, setFilters] = useState<{ status?: string }>({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshKey, setRefreshkey] = useState(1);
  const [selectedTask, setSelectedTask] = useState<MaintenanceRecord>();

  const handleItemClick = (row: MaintenanceRecord) => {
    setSelectedTask(row);
    setEditModalOpen(true);
  };

  const startTask = (row: MaintenanceRecord) => {
    
  }

  const columns = [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => (
        <div
          onClick={() => handleItemClick(row.original)}
          className="cursor-pointer whitespace-normal line-clamp-4"
        >
          <div className="text-xs text-muted-foreground">{row.original.type.charAt(0).toUpperCase() + row.original.type.slice(1)}</div>
          {row.original.title}
          {row.original.description && <div className="text-xs text-muted-foreground">{row.original.description}</div>}
        </div>
      ),
    },
    {
      header: "Ship",
      cell: ({ row }) => (
        <Link
          href={`/ships/${row.original.ship_id}`}
          className="flex gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-1">
            {row.original.ship_id && (
              <ShipImg
                id={row.original.ship_id}
                className="size-8 border rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              {row.original.ship?.name}
              <div className="text-xs text-muted-foreground truncate">
                {row.original.ship?.type} • {row.original.ship?.imo}
              </div>
            </div>
          </div>
          <div className="flex-1"></div>
        </Link>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due",
      cell: ({ row }) => (
        <>
          {row.original.dueDate && <FromCalendar date={row.original.dueDate} />}
        </>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
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
  ] as ColumnDef<MaintenanceRecord>[];

  const reloadData = () => {
    setRefreshkey(refreshKey + 1);
  };

  return (
    <div className="container max-w-3xl mx-auto">
      <h2 className="page-title mb-4">Tasks</h2>

      <PaginationTable
        key={refreshKey}
        url="/tasks/my-tasks"
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

      <EditTaskDialog
        open={editModalOpen}
        setOpen={setEditModalOpen}
        data={selectedTask}
        onSave={reloadData}
      />
    </div>
  );
}

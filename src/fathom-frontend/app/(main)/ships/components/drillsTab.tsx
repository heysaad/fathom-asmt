"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit2Icon,
  EllipsisVerticalIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { Drill } from "../models";
import apiClient from "@/app/lib/api-client";
import { toast } from "sonner";
import { PaginationTable } from "@/components/paginationTable";
import { ColumnDef } from "@tanstack/react-table";
import { DateFormat } from "@/components/libs/moment";
import CreateDrillDialog from "./createDrillDialog";
import EditDrillDialog from "./editDrillDialog";
import DrillAssignmentsSheet from "./drillAssignmentsSheet";

export default function DrillsSection({ shipId }: { shipId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [assignmentsSheetOpen, setAssignmentsSheetOpen] = useState(false);
  const [selectedDrillId, setSelectedDrillId] = useState<string | null>(null);
  const [selectedDrill, setSelectedDrill] = useState<Drill | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeleteClicked = (drillId: string) => {
    setShowDelete(true);
    setSelectedDrillId(drillId);
  };

  const handleEditClicked = (drill: Drill) => {
    setSelectedDrill(drill);
    setEditOpen(true);
  };

  const handleAssignmentsClicked = (drill: Drill) => {
    setSelectedDrill(drill);
    setAssignmentsSheetOpen(true);
  };

  const addDrillClicked = () => {
    setCreateOpen(true);
  };

  const onDelete = async () => {
    if (!selectedDrillId) return;
    try {
      await apiClient.delete(`/ships/${shipId}/drills/${selectedDrillId}`);
      toast.success("Drill deleted successfully");
      setShowDelete(false);
      setSelectedDrillId(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast.error("Failed to delete drill");
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      scheduled: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      missed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      fire_drill: "Fire Drill",
      evacuation: "Evacuation",
      man_overboard: "Man Overboard",
    };
    return labels[type] || type;
  };

  const columns: ColumnDef<Drill>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {getTypeLabel(row.original.type)}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.title || "-"}
          {row.original.notes && (
            <div className="text-xs text-muted-foreground mt-1">
              {row.original.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "scheduled_at",
      header: "Scheduled",
      cell: ({ row }) => (
        <DateFormat
          date={row.original.scheduled_at}
          format="DD MMM YYYY HH:mm"
        />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
            row.original.status,
          )}`}
        >
          {row.original.status.replace("_", " ").toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAssignmentsClicked(row.original)}
          >
            <UsersIcon className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <EllipsisVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => handleEditClicked(row.original)}
                >
                  <Edit2Icon className="size-3 mr-1" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteClicked(row.original.id)}
                >
                  <Trash2Icon className="size-3 mr-1" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PaginationTable
        key={refreshKey}
        url={`/ships/${shipId}/drills/list`}
        headerLeft={
          <div>
            <h2 className="font-medium">Safety drills</h2>
            <p className="text-sm text-muted-foreground">
              Drill schedule, completion state, and assigned participants.
            </p>
          </div>
        }
        actions={
          <Button type="button" onClick={addDrillClicked}>
            Create Drill
          </Button>
        }
        columns={columns}
      />

      <CreateDrillDialog
        shipId={shipId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleRefresh}
      />

      <EditDrillDialog
        data={selectedDrill}
        open={editOpen}
        setOpen={setEditOpen}
        shipId={shipId}
        onSave={handleRefresh}
      />

      {selectedDrill && (
        <DrillAssignmentsSheet
          open={assignmentsSheetOpen}
          onOpenChange={setAssignmentsSheetOpen}
          drill={selectedDrill}
          shipId={shipId}
          onRefresh={handleRefresh}
        />
      )}

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              drill record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={!selectedDrillId}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

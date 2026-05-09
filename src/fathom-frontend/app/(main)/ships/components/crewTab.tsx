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
} from "lucide-react";
import { useEffect, useState } from "react";
import { ShipCrewAssignment } from "../models";
import apiClient from "@/app/lib/api-client";
import { toast } from "sonner";
import { PaginationTable } from "@/components/paginationTable";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/app/lib/helpers";
import { DateFormat } from "@/components/libs/moment";
import CreateCrewDialog from "./createCrewDialog";
import EditCrewDialog from "./editCrewDialog";

export default function CrewSection({ shipId }: { shipId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<ShipCrewAssignment | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeleteClicked = (assignmentId: string) => {
    setShowDelete(true);
    setSelectedAssignmentId(assignmentId);
  };

  const handleEditClicked = (assignment: ShipCrewAssignment) => {
    setSelectedAssignment(assignment);
    setEditOpen(true);
  };

  const addCrewClicked = () => {
    setCreateOpen(true);
  };

  const onDelete = async () => {
    if (!selectedAssignmentId) return;
    try {
      await apiClient.delete(
        `/ships/${shipId}/crew/${selectedAssignmentId}`
      );
      toast.success("Crew member removed successfully");
      setShowDelete(false);
      setSelectedAssignmentId(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast.error("Failed to remove crew member");
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const columns: ColumnDef<ShipCrewAssignment>[] = [
    {
      accessorKey: "crew_member",
      header: "Crew Member",
      cell: ({ row }) => (
        <>
          {row.original.crew_member && (
            <div className="flex gap-2 items-center">
              <Avatar
                title={row.original.crew_member.name ?? ""}
              >
                <AvatarImage
                  src={getAvatarUrl(
                    row.original.crew_member?.name ??
                      row.original.crew_member?.email
                  )}
                />
              </Avatar>
              <div className="text-sm">
                <div className="font-medium">
                  {row.original.crew_member.name || "Unnamed"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {row.original.crew_member.email}
                </div>
              </div>
            </div>
          )}
        </>
      ),
    },
    {
      accessorKey: "crew_member.designation",
      header: "Designation",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.crew_member?.designation || "-"}
        </span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Assigned On",
      cell: ({ row }) => (
        <DateFormat
          date={row.original.created_at}
          format="DD MMM YYYY"
        />
      ),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center justify-end">
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
                  Remove
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
        url={`/ships/${shipId}/crew`}
        actions={
          <Button type="button" onClick={addCrewClicked}>
            Add Crew Member
          </Button>
        }
        columns={columns}
      />

      <CreateCrewDialog
        shipId={shipId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleRefresh}
      />

      <EditCrewDialog
        data={selectedAssignment}
        open={editOpen}
        setOpen={setEditOpen}
        shipId={shipId}
        onSave={handleRefresh}
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will remove the crew member
              from this ship.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={!selectedAssignmentId}
            >
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

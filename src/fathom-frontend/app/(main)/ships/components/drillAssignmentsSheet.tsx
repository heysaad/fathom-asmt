"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  CheckCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { Drill, DrillAssignment } from "../models";
import apiClient from "@/app/lib/api-client";
import { toast } from "sonner";
import { PaginationTable } from "@/components/paginationTable";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/app/lib/helpers";
import AddCrewToDrillDialog from "./addCrewToDrillDialog";
import EditDrillAssignmentDialog from "./editDrillAssignmentDialog";
import { UserBadge, UserBadgeSm } from "@/components/app/userBadge";
import { Badge } from "@/components/ui/badge";

interface DrillAssignmentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drill: Drill;
  shipId: string;
  onRefresh: () => void;
}

export default function DrillAssignmentsSheet({
  open,
  onOpenChange,
  drill,
  shipId,
  onRefresh,
}: DrillAssignmentsSheetProps) {
  const [addCrewOpen, setAddCrewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<DrillAssignment | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeleteClicked = (assignmentId: string) => {
    setShowDelete(true);
    setSelectedAssignmentId(assignmentId);
  };

  const handleEditClicked = (assignment: DrillAssignment) => {
    setSelectedAssignment(assignment);
    setEditOpen(true);
  };

  const onDelete = async () => {
    if (!selectedAssignmentId) return;
    try {
      await apiClient.delete(
        `/ships/${shipId}/drills/${drill.id}/assignments/${selectedAssignmentId}`
      );
      toast.success("Crew member removed from drill");
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

  const columns: ColumnDef<DrillAssignment>[] = [
    {
      accessorKey: "",
      header: "Crew Member",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.ship_crew_assignment?.crew_member && <UserBadgeSm data={row.original.ship_crew_assignment.crew_member} />}
          {row.original.remarks}
        </div>
      ),
    },
    {
        accessorKey: "is_attended",
        header: "Attended",
        cell: ({ row }) => (
          <Badge tone={row.original.is_attended ? "green" : "slate"}>
            {row.original.is_attended ? "Yes" : "No"}
          </Badge>
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
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:w-3/4 md:w-2/3">
          <SheetHeader>
            <SheetTitle>Drill Assignments</SheetTitle>
            <SheetDescription>
              Manage crew assignments for {drill.title || drill.type}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <PaginationTable
              key={refreshKey}
              url={`/ships/${shipId}/drills/${drill.id}/assignments/list`}
              actions={
                <Button
                  type="button"
                  onClick={() => setAddCrewOpen(true)}
                  size="sm"
                >
                  Add Crew
                </Button>
              }
              columns={columns}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AddCrewToDrillDialog
        shipId={shipId}
        drillId={drill.id}
        open={addCrewOpen}
        onOpenChange={setAddCrewOpen}
        onSuccess={handleRefresh}
      />

      <EditDrillAssignmentDialog
        data={selectedAssignment}
        open={editOpen}
        setOpen={setEditOpen}
        shipId={shipId}
        drillId={drill.id}
        onSave={handleRefresh}
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from drill?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The crew member will be removed from
              this drill.
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
    </>
  );
}

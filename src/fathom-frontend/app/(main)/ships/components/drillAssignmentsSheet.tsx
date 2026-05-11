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
  UserPlusIcon,
} from "lucide-react";
import { useState } from "react";
import { Drill, DrillAssignment } from "../models";
import apiClient from "@/app/lib/api-client";
import { toast } from "sonner";
import { PaginationTable } from "@/components/paginationTable";
import { ColumnDef } from "@tanstack/react-table";
import EditDrillAssignmentDialog from "./editDrillAssignmentDialog";
import { UserBadgeSm } from "@/components/app/userBadge";
import { Badge } from "@/components/ui/badge";
import { UserInput } from "@/components/user-input";

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
  const [editOpen, setEditOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<DrillAssignment | undefined>();
  const [selectedCrewId, setSelectedCrewId] = useState<string>();
  const [assigning, setAssigning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeleteClicked = (assignmentId: string) => {
    setShowDelete(true);
    setSelectedAssignmentId(assignmentId);
  };

  const handleEditClicked = (assignment: DrillAssignment) => {
    setSelectedAssignment(assignment);
    setEditOpen(true);
  };

  const handleAssignCrew = async () => {
    if (!selectedCrewId) {
      toast.error("Select a crew member first");
      return;
    }

    setAssigning(true);
    try {
      await apiClient.post(`/ships/${shipId}/drills/${drill.id}/assignments`, {
        crew_id: selectedCrewId,
      });
      toast.success("Crew member assigned to drill");
      setSelectedCrewId("");
      handleRefresh();
      onRefresh();
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        toast.error("This crew member is already assigned to this drill");
      } else {
        toast.error("Failed to assign crew member");
      }
    } finally {
      setAssigning(false);
    }
  };

  const setAttendance = async (assignment: DrillAssignment, isAttended: boolean) => {
    try {
      await apiClient.put(
        `/ships/${shipId}/drills/${drill.id}/assignments/${assignment.id}`,
        { is_attended: isAttended },
      );
      toast.success(isAttended ? "Attendance marked" : "Attendance cleared");
      handleRefresh();
      onRefresh();
    } catch {
      toast.error("Failed to update attendance");
    }
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
      handleRefresh();
      onRefresh();
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
          {row.original.remarks && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {row.original.remarks}
            </p>
          )}
        </div>
      ),
    },
    {
        accessorKey: "is_attended",
        header: "Attended",
        cell: ({ row }) => (
          <Badge tone={row.original.is_attended ? "green" : "slate"}>
            {row.original.is_attended ? "Attended" : "Pending"}
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
                  onClick={() =>
                    setAttendance(row.original, !row.original.is_attended)
                  }
                >
                  {row.original.is_attended
                    ? "Clear attendance"
                    : "Mark attended"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleEditClicked(row.original)}
                >
                  <Edit2Icon className="size-3 mr-1" />
                  Edit remarks
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
          <SheetHeader>
            <SheetTitle>Drill assignments</SheetTitle>
            <SheetDescription>
              Add crew members to {drill.title || drill.type.replace("_", " ")}.
              Status:{" "}
              <span className="capitalize">
                {drill.status.replace("_", " ")}
              </span>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5 px-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <p className="mb-2 text-sm font-medium">Add crew member</p>
                <UserInput
                  value={selectedCrewId}
                  onValueChange={(value) => setSelectedCrewId(value)}
                />
              </div>
              <Button
                type="button"
                onClick={handleAssignCrew}
                disabled={!selectedCrewId || assigning}
              >
                <UserPlusIcon className="size-4" />
                {assigning ? "Assigning..." : "Assign"}
              </Button>
            </div>

            <PaginationTable
              key={refreshKey}
              url={`/ships/${shipId}/drills/${drill.id}/assignments/list`}
              headerLeft={
                <div>
                  <h2 className="font-medium">Assigned crew</h2>
                  <p className="text-sm text-muted-foreground">
                    Crew currently assigned to this drill.
                  </p>
                </div>
              }
              columns={columns}
            />
          </div>
        </SheetContent>
      </Sheet>

      <EditDrillAssignmentDialog
        data={selectedAssignment}
        open={editOpen}
        setOpen={setEditOpen}
        shipId={shipId}
        drillId={drill.id}
        onSave={() => {
          handleRefresh();
          onRefresh();
        }}
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

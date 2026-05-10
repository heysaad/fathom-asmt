"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/datatable";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  CheckCircleIcon,
  Edit2Icon,
  EditIcon,
  EllipsisVerticalIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MaintenanceRecord } from "../models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateMaintainanceTaskDialog from "../../maintainance/components/createMaintainanceTaskDialog";
import apiClient from "@/app/lib/api-client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { DateFormat, FromNow } from "@/components/libs/moment";
import { useUser } from "@/app/lib/user-context";
import EditTaskDialog from "../../maintainance/components/editTaskDialog";
import { PaginationTable } from "@/components/paginationTable";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/app/lib/helpers";

export default function MaintainanceSection({ shipId }: { shipId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [data, setData] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { user } = useUser();
  const [openEdit, setOpenEdit] = useState(false);
  const [selected, setSelected] = useState<MaintenanceRecord>();

  const handleDeleteClickd = (taskId: string) => {
    setShowDelete(true);
    setSelectedTaskId(taskId);
  };

  const addTaskClicked = () => {
    setCreateOpen(true);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const response = await apiClient.get<MaintenanceRecord[]>(
      `/ships/${shipId}/maintainance-tasks`,
    );
    setData(response.data);
    setLoading(false);
  }, [shipId]);

  useEffect(() => {
    loadData();
  }, [shipId, loadData]);

  const onDelete = async () => {
    if (!selectedTaskId) return;
    await apiClient.delete(
      `/ships/${shipId}/maintainance-tasks/${selectedTaskId}`,
    );
    setData((prev) => prev.filter((t) => t.id !== selectedTaskId));
    toast.success("Task deleted successfully");
    setShowDelete(false);
    setSelectedTaskId(null);

    await loadData();
  };

  const handleEditClicked = (data: MaintenanceRecord) => {
    setSelected(data);
    setOpenEdit(true);
  };

  const setStatus = async (data: MaintenanceRecord, status: string) => {
    await apiClient.post(`/tasks/update-by-crew`, {
      id: data.id,
      status: status,
    });
    toast.success("Started task");
    await loadData();
  };

  return (
    <div>
      {loading && <p className="py-10 text-center">Loading...</p>}
      {!loading && (
        <PaginationTable
          url={`/ships/${shipId}/tasks-paginated`}
          headerLeft={
            <div>
              <h2 className="font-medium">Maintenance tasks</h2>
              <p className="text-sm text-muted-foreground">
                Planned and active work assigned to this vessel.
              </p>
            </div>
          }
          actions={
            <Button type="button" onClick={addTaskClicked}>
              Add Task
            </Button>
          }
          columns={
            [
              {
                accessorKey: "title",
                header: "Description",
                cell: ({ row }) => (
                  <div className="flex gap-3 max-w-72 whitespace-normal">
                    <div
                      className={`rounded-full h-4 w-1 bg-gray-100 mt-1 
                    ${
                      row.original.status === "completed"
                        ? "bg-green-500"
                        : row.original.status === "in_progress"
                          ? "bg-yellow-500"
                          : "bg-orange-500"
                    }`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      {row.original.title}
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {row.original.description}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                accessorKey: "type",
                header: "Type",
                cell: ({ row }) =>
                  row.original.type.charAt(0).toUpperCase() +
                  row.original.type.slice(1),
              },
              {
                accessorKey: "assignedToId",
                header: "Assigned",
                cell: ({ row }) => (
                  <>
                    {row.original.assignedTo && (
                      <div className="flex gap-2 items-center text-xs">
                        <Avatar title={row.original.assignedTo.name ?? ""}>
                          <AvatarImage
                            src={getAvatarUrl(
                              row.original.assignedTo?.name ??
                                row.original.assignedTo?.email,
                            )}
                          />
                        </Avatar>
                        <div>
                          {row.original.assignedTo.name}
                          <div>{row.original.assignedTo.email}</div>
                        </div>
                      </div>
                    )}
                  </>
                ),
              },
              {
                accessorKey: "dueDate",
                header: "Due",
                cell: ({ row }) => (
                  <>
                    <DateFormat
                      date={row.original.dueDate}
                      format="DD MMM YYYY"
                    />
                  </>
                ),
              },
              {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => {
                  const status = row.original.status;
                  let color = "gray";
                  if (status === "completed")
                    color = "bg-green-100 text-green-800";
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
                accessorKey: "actions",
                header: "",
                cell: ({ row }) => (
                  <div className="flex gap-2 items-center justify-end">
                    {row.original.assignedToId == user?.id &&
                      row.original.status == "scheduled" && (
                        <Button
                          variant={"outline"}
                          size={"xs"}
                          onClick={() => setStatus(row.original, "in_progress")}
                        >
                          Start
                        </Button>
                      )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost">
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
                          {row.original.status !== "completed" && (
                            <DropdownMenuItem>
                              <CheckCircleIcon className="size-3 mr-1" />
                              Mark as Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteClickd(row.original.id)}
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
            ] as ColumnDef<MaintenanceRecord>[]
          }
        />
      )}

      <CreateMaintainanceTaskDialog
        shipId={shipId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={loadData}
      />

      <EditTaskDialog
        data={selected}
        open={openEdit}
        setOpen={setOpenEdit}
        onSave={loadData}
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant={"destructive"}
              onClick={onDelete}
              disabled={!selectedTaskId}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

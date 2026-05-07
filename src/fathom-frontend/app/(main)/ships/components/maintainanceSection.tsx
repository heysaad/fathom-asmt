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
import { useState } from "react";
import { MaintenanceRecord } from "../models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateMaintainanceTaskDialog from "../../maintainance/components/createMaintainanceTaskDialog";

export default function MaintainanceSection({ shipId }: { shipId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const addTaskClicked = () => {
    setCreateOpen(true);
  };
  const [data, setData] = useState<MaintenanceRecord[]>([
    {
      id: "1",
      title: "Engine Check",
      description: "Routine engine check to ensure optimal performance.",
      type: "routine",
      dueDate: "2024-01-15",
      status: "completed",
    },
    {
      id: "2",
      title: "Hull Inspection",
      description: "Inspect hull for any signs of damage or corrosion.",
      type: "routine",
      dueDate: "2024-02-20",
      status: "scheduled",
    },
    {
      id: "3",
      title: "Navigation System Update",
      description: "Upgrade navigation software to the latest version.",
      type: "upgrade",
      dueDate: "2024-03-10",
      status: "in_progress",
    },
  ]);

  return (
    <div>
      <div className="flex justify-end gap-3 mb-4">
        <InputGroup className="w-48">
          <InputGroupInput placeholder="Search.." />
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
        </InputGroup>
        <Button type="button" onClick={addTaskClicked}>
          Add Task
        </Button>
      </div>
      <CreateMaintainanceTaskDialog
        shipId={shipId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <DataTable
        columns={[
          {
            accessorKey: "title",
            header: "Task",
            cell: ({ row }) => (
              <div className="flex gap-3">
                <div
                  className={`rounded-full h-6 w-1 bg-gray-100 mt-1 
                    ${
                      row.original.status === "completed"
                        ? "bg-green-500"
                        : row.original.status === "in_progress"
                          ? "bg-yellow-500"
                          : "bg-orange-500"
                    }`}
                ></div>
                <div className="flex-1">
                  {row.original.title}
                  <div className="text-xs text-muted-foreground">
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
            accessorKey: "dueDate",
            header: "Due",
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
          {
            accessorKey: "actions",
            header: "",
            cell: ({ row }) => (
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      <EllipsisVerticalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-44" align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <Edit2Icon className="size-3 mr-1" />
                        Edit
                      </DropdownMenuItem>
                      {row.original.status !== "completed" && (
                        <DropdownMenuItem>
                          <CheckCircleIcon className="size-3 mr-1" />
                          Mark as Complete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Trash2Icon className="size-3 mr-1" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
        ]}
        data={data}
      />
    </div>
  );
}

"use client";

import apiClient from "@/app/lib/api-client";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/datatable";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { UserVM } from "./models";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/app/lib/helpers";

export default function UsersPage() {
  const [users, setUsers] = React.useState<UserVM[]>([]);
  const router = useRouter();

  const loadUsers = async () => {
    const data = await apiClient.get<UserVM[]>("/users");
    setUsers(data.data);
  };

  React.useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="container max-w-3xl mx-auto">
      <div className="mb-4 flex justify-between gap-4">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="text-sm text-muted-foreground">Manage the user directory and assign roles.</p>
        </div>

        <div className="flex gap-3 items-center">
          <InputGroup>
            <InputGroupInput placeholder="Search.." />
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
          </InputGroup>
          <Button onClick={() => router.push("/admin/user/new")}>Add User</Button>
        </div>
      </div>

      <DataTable
        columns={[
          {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
              <Link href={`/admin/users/${row.original.id}`} className="font-medium flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={getAvatarUrl(row.original.name ?? row.original.email)} />
                </Avatar>
                <div className="flex-1">
                  {row.original.name || row.original.email}
                  <div className="text-sm">{row.original.email}</div>
                </div>
              </Link>
            ),
          },
          {
            accessorKey: "designation",
            header: "Designation",
            cell: ({ row }) => row.original.designation || "—",
          },
          {
            accessorKey: "role",
            header: "Role",
          },
        ]}
        data={users}
      />
    </div>
  );
}

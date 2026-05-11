"use client";

import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ui/badge";
import { PaginationTable } from "@/components/paginationTable";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import CreateShipDialog, {
  CreateShipDialogHandle,
} from "./components/createShipDialog";
import type { ShipVM } from "./models";
import ShipImg from "./components/shipImg";

export default function ShipsPage() {
  const addRef = React.useRef<CreateShipDialogHandle>(null);

  const showAdd = () => addRef.current?.show();

  const columns = [
    {
      accessorKey: "name",
      header: "Ship",
      cell: ({ row }) => (
        <Link
          href={`/ships/${row.original.id}`}
          className="flex min-w-64 items-center gap-3"
        >
          <ShipImg
            width={44}
            height={44}
            className="size-11 rounded-lg border bg-muted"
            id={row.original.id}
          />
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.type ?? "Vessel"}
              {row.original.imo ? ` - IMO ${row.original.imo}` : ""}
            </div>
          </div>
        </Link>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <p className="max-w-80 line-clamp-2 text-sm text-muted-foreground">
          {row.original.description || "No description"}
        </p>
      ),
    },
    {
      accessorKey: "compliance_score",
      header: "Compliance",
      cell: ({ row }) => (
        <ScoreBadge score={row.original.compliance_score} />
      ),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href={`/ships/${row.original.id}`}>View</Link>
          </Button>
        </div>
      ),
    },
  ] as ColumnDef<ShipVM>[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center"></div>
      </div>

      <div>
        <PaginationTable
          url="/ships/paginated"
          columns={columns}
          headerLeft={
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Ships
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Manage vessel records and scan compliance status across the
                fleet.
              </p>
            </div>
          }
          actions={
            <Button onClick={showAdd}>
              <PlusIcon className="size-4" />
              Add Ship
            </Button>
          }
        />
      </div>
      <CreateShipDialog ref={addRef} />
    </div>
  );
}

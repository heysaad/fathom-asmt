"use client";

import { Button } from "@/components/ui/button";
import { PaginationTable } from "@/components/paginationTable";
import { PlusIcon, ShipWheelIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import CreateShipDialog, {
  CreateShipDialogHandle,
} from "./components/createShipDialog";
import type { ShipVM } from "./models";
import ShipImg from "./components/shipImg";

function ComplianceBadge({ score }: { score?: number }) {
  const value = score ?? 0;
  const tone =
    value >= 90
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : value >= 70
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-red-50 text-red-700 ring-red-200";

  return (
    <div className="min-w-36">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span
          className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${tone}`}
        >
          {value}%
        </span>
        <span className="text-xs text-muted-foreground">
          {value >= 90 ? "Good" : value >= 70 ? "Watch" : "Risk"}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

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
        <ComplianceBadge score={row.original.compliance_score} />
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

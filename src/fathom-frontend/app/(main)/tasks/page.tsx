"use client";

import { PaginationTable } from "@/components/paginationTable";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function DrillsPage() {
  const [filters, setFilters] = useState<{ status?: string }>({});

  return (
    <div className="container max-w-3xl mx-auto">
      <h2 className="page-title mb-4">Tasks</h2>

      <PaginationTable
        url="/tasks/me/paginated"
        columns={[{ accessorKey: "id", header: "Id" }]}
        filters={filters}
        headerLeft={
          <div className="flex items-center gap-3">
            <NativeSelect
              value={filters.status}
              onChange={(x) => setFilters({ ...filters, status: x.target.value })}
            >
              <NativeSelectOption value="">All</NativeSelectOption>
              <NativeSelectOption value="pending">Pending</NativeSelectOption>
              <NativeSelectOption value="in_progress">In Progress</NativeSelectOption>
              <NativeSelectOption value="completed">Completed</NativeSelectOption>
            </NativeSelect>
          </div>
        }
      />
    </div>
  );
}

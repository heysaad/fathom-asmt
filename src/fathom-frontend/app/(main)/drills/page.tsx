import { PaginationTable } from "@/components/paginationTable";

export default function DrillsPage() {
  return (
    <PaginationTable
      url="/drills"
      columns={[{ accessorKey: "id", header: "Id" }]}
    />
  );
}

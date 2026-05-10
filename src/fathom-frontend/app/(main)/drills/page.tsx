import { PaginationTable } from "@/components/paginationTable";

export default function DrillsPage() {
  return (
    <PaginationTable
      url="/drills/list"
      columns={[{ accessorKey: "id", header: "Id" }]}
    />
  );
}

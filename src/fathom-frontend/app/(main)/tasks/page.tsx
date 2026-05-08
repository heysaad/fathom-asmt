import { PaginationTable } from "@/components/paginationTable";

export default function DrillsPage() {
  return (
    <PaginationTable
      url="/tasks/paginated"
      columns={[{ accessorKey: "id", header: "Id" }]}
    />
  );
}

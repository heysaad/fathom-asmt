import Link from "next/link";

import ShipImg from "../../ships/components/shipImg";

export function ShipCell({
  shipId,
  name,
  type,
  imo,
}: {
  shipId?: string;
  name?: string;
  type?: string;
  imo?: string;
}) {
  if (!shipId) return <span className="text-muted-foreground">Unassigned</span>;

  return (
    <Link href={`/ships/${shipId}`} className="flex min-w-52 items-center gap-2">
      <ShipImg id={shipId} className="size-9 rounded-lg" />
      <span className="min-w-0">
        <span className="block truncate font-medium">{name ?? "Ship"}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {type ?? "Vessel"} {imo ? `- IMO ${imo}` : ""}
        </span>
      </span>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";

import apiClient from "@/app/lib/api-client";
import { ensureSuccess } from "@/app/lib/helpers";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { ShipVM } from "../../ships/models";

export function ShipFilter({
  value,
  onValueChange,
}: {
  value?: string;
  onValueChange: (value: string) => void;
}) {
  const [ships, setShips] = useState<ShipVM[]>([]);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .post<{ data: ShipVM[] }>("/ships/paginated", {
        page: 1,
        pageSize: 100,
      })
      .then((response) => {
        ensureSuccess(response);
        if (!cancelled) {
          setShips(response.data.data);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <NativeSelect
      aria-label="Filter by ship"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <NativeSelectOption value="">All ships</NativeSelectOption>
      {ships.map((ship) => (
        <NativeSelectOption key={ship.id} value={ship.id}>
          {ship.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

"use client";

import React, { use, useEffect } from "react";
import Link from "next/link";
import {
  AnchorIcon,
  ArrowLeftIcon,
  ClipboardListIcon,
  FlameIcon,
  Loader2Icon,
  PencilIcon,
  UsersIcon,
} from "lucide-react";

import apiClient from "@/app/lib/api-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CrewTab from "../components/crewTab";
import DrillsTab from "../components/drillsTab";
import MaintainanceSection from "../components/tasksTab";
import ShipImg from "../components/shipImg";
import type { ShipVM } from "../models";
import { useSearchParams } from "next/navigation";
import EditShipDialog from "../components/editShipDialog";
import { canAddDrill } from "@/app/lib/permissions";
import { useUser } from "@/app/lib/user-context";

function CompliancePanel({ score }: { score?: number }) {
  const value = score ?? 0;
  const label = value >= 90 ? "Good" : value >= 70 ? "Watch" : "Risk";
  const tone =
    value >= 90
      ? "text-emerald-700"
      : value >= 70
        ? "text-amber-700"
        : "text-red-700";

  return (
    <div className="w-full max-w-56">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Compliance
          </p>
          <p className={`mt-1 text-3xl font-semibold tracking-tight ${tone}`}>
            {value}%
          </p>
        </div>
        <span className={`pb-1 text-sm font-medium ${tone}`}>{label}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function ShipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: shipId } = use(params);
  const [ship, setShip] = React.useState<ShipVM | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false);
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab");
  const { user } = useUser();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = (await apiClient.get<ShipVM>(`/ships/${shipId}`)).data;
        setShip(response);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shipId]);

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ship) {
    return (
      <div className="mx-auto max-w-5xl py-16 text-center">
        <h1 className="text-xl font-semibold">Ship not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This ship record may have been removed.
        </p>
        <Button asChild className="mt-5" variant="outline">
          <Link href="/ships">
            <ArrowLeftIcon className="size-4" />
            Back to ships
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/ships">
            <ArrowLeftIcon className="size-4" />
            Ships
          </Link>
        </Button>

        {canAddDrill(user) && (
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <PencilIcon className="size-4" />
            Edit details
          </Button>
        )}
      </div>

      <section className="flex flex-col gap-6 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row">
          <ShipImg
            id={ship.id}
            width={128}
            height={128}
            className="size-32 rounded-lg bg-muted object-cover"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <AnchorIcon className="size-4" />
              <span>{ship.type || "Vessel"}</span>
              {ship.imo && (
                <>
                  <span>-</span>
                  <span>IMO {ship.imo}</span>
                </>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {ship.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {ship.description ||
                "No description has been added for this ship."}
            </p>
          </div>
        </div>

        <CompliancePanel score={ship.compliance_score} />
      </section>

      <Tabs defaultValue={queryTab ?? "crew"} className="gap-5">
        <TabsList className="justify-start">
          <TabsTrigger value="crew">
            <UsersIcon className="size-4" />
            Crew
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ClipboardListIcon className="size-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="drills">
            <FlameIcon className="size-4" />
            Safety Drills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <MaintainanceSection shipId={shipId} />
        </TabsContent>

        <TabsContent value="drills">
          <DrillsTab shipId={shipId} />
        </TabsContent>

        <TabsContent value="crew">
          <CrewTab shipId={shipId} />
        </TabsContent>
      </Tabs>

      <EditShipDialog
        open={editOpen}
        setOpen={setEditOpen}
        ship={ship}
        onSave={setShip}
      />
    </div>
  );
}

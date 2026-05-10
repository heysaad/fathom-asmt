"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import MaintainanceSection from "../components/tasksTab";
import React, { use, useEffect } from "react";
import apiClient from "@/app/lib/api-client";
import { ShipVM } from "../models";
import CrewTab from "../components/crewTab";
import DrillsTab from "../components/drillsTab";

export default function ShipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: shipId } = use(params);
  const [ship, setShip] = React.useState<ShipVM | null>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const response = (await apiClient.get<ShipVM>(`/ships/${shipId}`)).data;
      setShip(response);
      setLoading(false);
    };

    loadData();
  }, [shipId]);

  if (loading) {
    return <div>Loading...</div>;
  } else if (ship)
    return (
      <div className="container max-w-5xl mx-auto">
        <div className="flex gap-4">
          <div>
            <Image
              src="/imgs/ship1.png"
              width={100}
              height={100}
              alt="Ship"
              className="rounded-lg size-32 border border-gray-100"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mt-2">{ship.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{ship.imo}</span>
              <span>•</span>
              <span className="text-sm text-muted-foreground">{ship.type}</span>
            </div>
            <p className="text-sm mt-2">{ship.description}</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="maintainance">Maintainance</TabsTrigger>
            <TabsTrigger value="safety-crew">Crew Members</TabsTrigger>
            <TabsTrigger value="drills">Safety Drills</TabsTrigger>
            <TabsTrigger value="compliance">Compliance & Audits</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p>Overview content goes here.</p>
          </TabsContent>
          <TabsContent value="maintainance">
            <MaintainanceSection shipId={shipId} />
          </TabsContent>
          <TabsContent value="drills">
            <DrillsTab shipId={shipId} />
          </TabsContent>
          <TabsContent value="safety-crew">
            <CrewTab shipId={shipId} />
          </TabsContent>
          <TabsContent value="compliance">
            <p>Compliance & Audits content goes here.</p>
          </TabsContent>
        </Tabs>
      </div>
    );
}

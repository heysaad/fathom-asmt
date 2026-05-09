"use client";

import apiClient from "@/app/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShipCrewAssignment } from "../models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddCrewToDrillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  shipId: string;
  drillId: string;
}

export default function AddCrewToDrillDialog({
  open,
  onOpenChange,
  onSuccess,
  shipId,
  drillId,
}: AddCrewToDrillDialogProps) {
  const [crewMembers, setCrewMembers] = useState<ShipCrewAssignment[]>([]);
  const [selectedCrewId, setSelectedCrewId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingCrew, setLoadingCrew] = useState(false);

  useEffect(() => {
    if (open) {
      loadCrewMembers();
    }
  }, [open]);

  const loadCrewMembers = async () => {
    setLoadingCrew(true);
    try {
      const response = await apiClient.get<{
        data: ShipCrewAssignment[];
        total: number;
      }>(`/ships/${shipId}/crew?pageSize=100`);
      setCrewMembers(response.data.data);
    } catch (error) {
      toast.error("Failed to load crew members");
    } finally {
      setLoadingCrew(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrewId) {
      toast.error("Please select a crew member");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/ships/${shipId}/drills/${drillId}/assignments`, {
        ship_crew_assignment_id: selectedCrewId,
      });
      toast.success("Crew member assigned to drill");
      onOpenChange(false);
      setSelectedCrewId("");
      onSuccess();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("This crew member is already assigned to this drill");
      } else {
        toast.error("Failed to assign crew member");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Crew to Drill</DialogTitle>
          <DialogDescription>
            Add a crew member to this drill.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field>
            <FieldLabel>Select Crew Member</FieldLabel>
            <Select
              value={selectedCrewId}
              onValueChange={setSelectedCrewId}
            >
              <SelectTrigger disabled={loadingCrew || loading}>
                <SelectValue placeholder="Select a crew member" />
              </SelectTrigger>
              <SelectContent>
                {crewMembers.map((crew) => (
                  <SelectItem key={crew.id} value={crew.id}>
                    {crew.crew_member?.name || crew.crew_member?.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={loading || loadingCrew}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedCrewId || loading || loadingCrew}
            >
              {loading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

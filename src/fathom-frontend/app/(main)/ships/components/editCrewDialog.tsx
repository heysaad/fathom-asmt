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
import { ShipCrewAssignment } from "../models";
import { toast } from "sonner";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditCrewDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: ShipCrewAssignment;
  shipId: string;
  onSave: () => void;
}

export default function EditCrewDialog({
  open,
  setOpen,
  data,
  shipId,
  onSave,
}: EditCrewDialogProps) {
  const [isActive, setIsActive] = useState(data?.is_active ?? true);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setLoading(true);
    try {
      await apiClient.put(`/ships/${shipId}/crew/${data.id}`, {
        is_active: isActive,
      });
      toast.success("Crew assignment updated successfully");
      setOpen(false);
      onSave();
    } catch (error) {
      toast.error("Failed to update crew assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Crew Assignment</DialogTitle>
          <DialogDescription>
            Update the crew member assignment details.
          </DialogDescription>
        </DialogHeader>

        {data && (
          <form onSubmit={handleSave} className="space-y-3">
            <Field>
              <FieldLabel>Crew Member</FieldLabel>
              <div className="text-sm bg-muted p-2 rounded">
                {data.crew_member?.name || data.crew_member?.email}
              </div>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={isActive ? "active" : "inactive"}
                onValueChange={(val) => setIsActive(val === "active")}
              >
                <SelectTrigger disabled={loading}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

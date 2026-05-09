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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserInput } from "@/components/user-input";

interface CreateCrewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  shipId: string;
}

export default function CreateCrewDialog({
  open,
  onOpenChange,
  onSuccess,
  shipId,
}: CreateCrewDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Please select a crew member");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/ships/${shipId}/crew`, {
        crew_member_id: selectedUserId,
      });
      toast.success("Crew member added successfully");
      onOpenChange(false);
      setSelectedUserId("");
      onSuccess();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("This crew member is already assigned to this ship");
      } else {
        toast.error("Failed to add crew member");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Crew Member</DialogTitle>
          <DialogDescription>
            Assign a crew member to this ship.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field>
            <FieldLabel>Select Crew Member</FieldLabel>
            <UserInput
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              placeholder="Select a crew member"
            />
          </Field>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedUserId || loading}>
              {loading ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

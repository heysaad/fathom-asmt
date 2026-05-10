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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DrillAssignment } from "../models";

interface EditDrillAssignmentDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: DrillAssignment;
  shipId: string;
  drillId: string;
  onSave: () => void;
}

export default function EditDrillAssignmentDialog({
  open,
  setOpen,
  data,
  shipId,
  drillId,
  onSave,
}: EditDrillAssignmentDialogProps) {
  const [isAttended, setIsAttended] = useState<string>("false");
  const [isCompleted, setIsCompleted] = useState<string>("false");
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setIsAttended(data.is_attended ? "true" : "false");
      setIsCompleted(data.is_completed ? "true" : "false");
      setRemarks(data.remarks || "");
    }
  }, [data, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setLoading(true);
    try {
      await apiClient.put(
        `/ships/${shipId}/drills/${drillId}/assignments/${data.id}`,
        {
          is_attended: isAttended === "true",
          is_completed: isCompleted === "true",
          remarks: remarks || null,
        }
      );
      toast.success("Assignment updated successfully");
      setOpen(false);
      onSave();
    } catch (error) {
      toast.error("Failed to update assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Drill Assignment</DialogTitle>
          <DialogDescription>
            Update crew member assignment details.
          </DialogDescription>
        </DialogHeader>

        {data && (
          <form onSubmit={handleSave} className="space-y-3">
            <Field>
              <FieldLabel>Attended</FieldLabel>
              <Select value={isAttended} onValueChange={setIsAttended}>
                <SelectTrigger disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Remarks</FieldLabel>
              <Textarea
                placeholder="Enter remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={loading}
              />
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

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
import { Input } from "@/components/ui/input";
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
import { Drill } from "../models";

interface EditDrillDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: Drill;
  shipId: string;
  onSave: () => void;
}

const DRILL_STATUSES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "missed", label: "Missed" },
  { value: "cancelled", label: "Cancelled" },
];

const DRILL_TYPES = [
  { value: "fire_drill", label: "Fire Drill" },
  { value: "evacuation", label: "Evacuation" },
  { value: "man_overboard", label: "Man Overboard" },
];

export default function EditDrillDialog({
  open,
  setOpen,
  data,
  shipId,
  onSave,
}: EditDrillDialogProps) {
  const [title, setTitle] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setTitle(data.title || "");
      setStatus(data.status);
      setScheduledAt(data.scheduled_at);
      setNotes(data.notes || "");
    }
  }, [data, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setLoading(true);
    try {
      await apiClient.put(`/ships/${shipId}/drills/${data.id}`, {
        title: title || null,
        status,
        scheduled_at: scheduledAt,
        notes: notes || null,
      });
      toast.success("Drill updated successfully");
      setOpen(false);
      onSave();
    } catch (error) {
      toast.error("Failed to update drill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Drill</DialogTitle>
          <DialogDescription>Update drill details.</DialogDescription>
        </DialogHeader>

        {data && (
          <form onSubmit={handleSave} className="space-y-3">
            <Field>
              <FieldLabel>Drill Type</FieldLabel>
              <div className="text-sm bg-muted p-2 rounded">
                {
                  DRILL_TYPES.find((t) => t.value === data.type)?.label ||
                  data.type
                }
              </div>
            </Field>

            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Scheduled Date & Time</FieldLabel>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger disabled={loading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DRILL_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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

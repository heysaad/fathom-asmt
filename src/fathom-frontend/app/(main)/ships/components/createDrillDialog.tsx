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
import { useState } from "react";
import { toast } from "sonner";

interface CreateDrillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  shipId: string;
}

const DRILL_TYPES = [
  { value: "fire_drill", label: "Fire Drill" },
  { value: "evacuation", label: "Evacuation" },
  { value: "man_overboard", label: "Man Overboard" },
];

export default function CreateDrillDialog({
  open,
  onOpenChange,
  onSuccess,
  shipId,
}: CreateDrillDialogProps) {
  const [type, setType] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type || !scheduledAt) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/ships/${shipId}/drills`, {
        type,
        title: title || null,
        scheduled_at: scheduledAt,
        notes: notes || null,
      });
      toast.success("Drill created successfully");
      onOpenChange(false);
      setType("");
      setTitle("");
      setScheduledAt("");
      setNotes("");
      onSuccess();
    } catch (error) {
      toast.error("Failed to create drill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Drill</DialogTitle>
          <DialogDescription>
            Schedule a new drill for the ship.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field>
            <FieldLabel>Drill Type *</FieldLabel>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger disabled={loading}>
                <SelectValue placeholder="Select drill type" />
              </SelectTrigger>
              <SelectContent>
                {DRILL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input
              placeholder="Enter drill title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </Field>

          <Field>
            <FieldLabel>Scheduled Date & Time *</FieldLabel>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              disabled={loading}
            />
          </Field>

          <Field>
            <FieldLabel>Notes</FieldLabel>
            <Textarea
              placeholder="Enter notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
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
            <Button type="submit" disabled={!type || !scheduledAt || loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import apiClient from "@/app/lib/api-client";
import { FromCalendar, DateFormat } from "@/components/libs/moment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { DrillStatusBadge } from "@/components/app/drillStatusBadge";
import type { DrillAssignment } from "../../ships/models";

export function AttendanceDialog({
  shipId,
  drillId,
  open,
  setOpen,
  onMarked,
}: {
  shipId?: string;
  drillId?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onMarked?: () => void;
}) {
  const [assignment, setAssignment] = useState<DrillAssignment | null>(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !shipId || !drillId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.get<DrillAssignment>(
          `/ships/${shipId}/drills/${drillId}/assignments/me`,
        );

        setAssignment(data);
        setRemarks(data.remarks ?? "");
      } catch {
          setAssignment(null);
          setError("No assignment was found for your account on this drill.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shipId, drillId, open]);

  const markAttendance = async () => {
    if (!shipId || !drillId) return;

    setSaving(true);
    try {
      const { data } = await apiClient.put<DrillAssignment>(
        `/ships/${shipId}/drills/${drillId}/assignments/me/attendance`,
        { remarks: remarks.trim() || null },
      );
      setAssignment(data);
      toast.success("Your attendance has been marked");
      onMarked?.();
      setOpen(false);
    } catch {
      toast.error("Failed to mark attendance");
    } finally {
      setSaving(false);
    }
  };

  const drill = assignment?.drill;
  const isAlreadyAttended = assignment?.is_attended;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark attendance</DialogTitle>
          <DialogDescription>
            Confirm your attendance for this safety drill.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!loading && error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {!loading && assignment && (
          <div className="space-y-4">
            <div className="rounded-lg border p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium capitalize text-muted-foreground">
                    {drill?.type.replaceAll("_", " ")}
                  </p>
                  <h3 className="mt-1 font-medium">
                    {drill?.title ?? drill?.type.replaceAll("_", " ")}
                  </h3>
                </div>
                {drill && <DrillStatusBadge drill={drill} />}
              </div>
              <div className="mt-3 gap-2 text-sm text-muted-foreground space-y-1">
                <div>
                  Scheduled:{" "}
                  <span className="text-foreground">
                    <FromCalendar date={drill?.scheduled_at} />
                  </span>
                </div>
                <div>
                  Assigned:{" "}
                  <span className="text-foreground">
                    <DateFormat date={assignment.assigned_at} />
                  </span>
                </div>
              </div>
              {drill?.notes && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {drill.notes}
                </p>
              )}
            </div>

            {isAlreadyAttended ? (
              <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                <CheckIcon className="size-4" />
                Attendance marked
                {assignment.attended_at && (
                  <span className="text-emerald-600">
                    on <DateFormat date={assignment.attended_at} />
                  </span>
                )}
              </div>
            ) : (
              <Badge tone="amber">Attendance pending</Badge>
            )}

            <Field>
              <FieldLabel>Remarks</FieldLabel>
              <Textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Add optional remarks"
                disabled={saving}
              />
            </Field>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={markAttendance}
            disabled={loading || saving || !assignment || isAlreadyAttended}
          >
            {saving && <Loader2Icon className="size-4 animate-spin" />}
            {isAlreadyAttended ? "Already marked" : "Mark attendance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

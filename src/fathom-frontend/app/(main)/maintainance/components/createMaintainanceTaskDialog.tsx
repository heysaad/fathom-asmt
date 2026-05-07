import apiClient from "@/app/lib/api-client";
import { ensureSuccess } from "@/app/lib/helpers";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export default function CreateMaintainanceTaskDialog({
  shipId,
  open,
  onOpenChange,
  onSuccess,
}: {
  shipId: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const modelSchema = z.object({
    title: z.string().min(1, "Title is required"),
    type: z
      .enum(["routine", "repair", "inspection", "upgrade"])
      .default("routine"),
    dueDate: z
      .string()
      .default(() => new Date().toISOString()),
  });
  type modelType = z.infer<typeof modelSchema>;

  const loadData = async () => {};

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<modelType>({ resolver: zodResolver(modelSchema) });

  useEffect(() => {
    if (open && shipId) {
      reset();
      loadData();
    }
  }, [open, shipId]);

  const onSubmit = async (data: modelType) => {
    const response = await apiClient.post(
      `/ships/${shipId}/maintainance-tasks`,
      { ...data, status: "scheduled" },
    );
    ensureSuccess(response);
    onOpenChange?.(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="gap-0">
          <DialogTitle>Create Maintenance Task</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new maintenance task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input
              placeholder="Enter task title"
              {...register("title")}
              autoComplete="off"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Type</FieldLabel>
              <select
                className="w-full border rounded-md p-2"
                {...register("type")}
              >
                <option value="routine">Routine</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
                <option value="upgrade">Upgrade</option>
              </select>
            </Field>
            <Field>
              <FieldLabel>Due Date</FieldLabel>
              <Input type="date" {...register("dueDate")} autoComplete="off" />
            </Field>
          </div>
          <DialogFooter className="pt-2">
            <Button variant={"secondary"} onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

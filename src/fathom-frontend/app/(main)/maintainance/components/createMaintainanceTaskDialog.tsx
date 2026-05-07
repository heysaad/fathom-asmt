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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export default function CreateMaintainanceTaskDialog({
  shipId,
  open,
  onOpenChange,
}: {
  shipId: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const modelSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    type: z
      .enum(["routine", "repair", "inspection", "upgrade"])
      .default("routine"),
    dueDate: z
      .string()
      .optional()
      .default(() => new Date().toISOString().split("T")[0]), // default to today's date
    status: z
      .enum(["scheduled", "in_progress", "completed"])
      .default("scheduled"),
  });
  type modelType = z.infer<typeof modelSchema>;

  const loadData = async () => {};

  useEffect(() => {
    if (open && shipId) {
      loadData();
    }
  }, [open, shipId]);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<modelType>({ resolver: zodResolver(modelSchema) });
  const onSubmit = async (data: modelType) => {
    const response = await apiClient.post("/maintenance-tasks", data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Maintenance Task</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new maintenance task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
              <FieldLabel>Status</FieldLabel>
              <select
                className="w-full border rounded-md p-2"
                {...register("status")}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
          </div>
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

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              placeholder="Enter task description"
              {...register("description")}
              autoComplete="off"
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel>Due Date</FieldLabel>
            <Input type="date" {...register("dueDate")} autoComplete="off" />
          </Field>

          <DialogFooter>
            <Button variant={"secondary"} onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

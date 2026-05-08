import apiClient from "@/app/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { useCallback, useEffect } from "react";
import { MaintenanceRecord } from "../../ships/models";
import { ensureSuccess } from "@/app/lib/helpers";

export default function EditTaskDialog({
  open,
  setOpen,
  onSave,
  data,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  onSave?: () => void;
  data?: MaintenanceRecord;
}) {
  const modelSchema = z.object({
    status: z.enum(["scheduled", "in_progress", "completed"]),
    description: z.string().optional(),
  });
  type modelType = z.infer<typeof modelSchema>;
  const {
    register,
    handleSubmit,
    setValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(modelSchema),
  });

  const onSubmit = async (model: modelType) => {
    const response = await apiClient.post("/tasks/update-by-crew", {
      ...model,
      id: data?.id,
    });
    ensureSuccess(response)
    toast.success("Data updated");
    setOpen(false);
    onSave?.();
  };

  useEffect(() => {
    const onOpen = () => {
      console.log("data", data);

      if (!data) return;
      setValues({
        status: data.status,
        description: data.description || undefined,
      });
    };

    if (open) onOpen();
  }, [open, setValues, data]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="status"
            control={control}
            render={({ field, fieldState }) => (
              <Field className="w-1/2">
                <FieldLabel>Status</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Field>
            <FieldLabel>Comments</FieldLabel>
            <Textarea {...register("description")} autoComplete="off" />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </Field>
          <DialogFooter className="pt-2">
            <Button type="button" variant={"secondary"} onClick={() => setOpen?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

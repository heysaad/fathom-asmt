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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { ShipVM } from "../models";

const shipSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Ship type is required"),
  imo: z.string().optional(),
  description: z.string().optional(),
});

type ShipFormValues = z.infer<typeof shipSchema>;

export default function EditShipDialog({
  open,
  setOpen,
  ship,
  onSave,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  ship?: ShipVM;
  onSave: (ship: ShipVM) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShipFormValues>({
    resolver: zodResolver(shipSchema),
    defaultValues: {
      name: "",
      type: "",
      imo: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open || !ship) return;

    reset({
      name: ship.name,
      type: ship.type ?? "",
      imo: ship.imo ?? "",
      description: ship.description ?? "",
    });
  }, [open, reset, ship]);

  const onSubmit = async (values: ShipFormValues) => {
    if (!ship) return;

    const { data } = await apiClient.put<ShipVM>(`/ships/${ship.id}`, {
      name: values.name.trim(),
      type: values.type.trim(),
      imo: values.imo?.trim() || null,
      description: values.description?.trim() || null,
    });

    toast.success("Ship details updated");
    onSave(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit ship details</DialogTitle>
          <DialogDescription>
            Update the vessel profile shown across the fleet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input
              placeholder="Enter ship name"
              autoComplete="off"
              disabled={isSubmitting}
              {...register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Input
                placeholder="Container Ship"
                autoComplete="off"
                disabled={isSubmitting}
                {...register("type")}
              />
              <FieldError errors={[errors.type]} />
            </Field>

            <Field>
              <FieldLabel>IMO Number</FieldLabel>
              <Input
                placeholder="IMO number"
                autoComplete="off"
                disabled={isSubmitting}
                {...register("imo")}
              />
              <FieldError errors={[errors.imo]} />
            </Field>
          </div>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              placeholder="Enter description"
              autoComplete="off"
              disabled={isSubmitting}
              {...register("description")}
            />
            <FieldError errors={[errors.description]} />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

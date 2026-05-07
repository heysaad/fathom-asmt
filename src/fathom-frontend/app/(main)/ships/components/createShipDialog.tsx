import apiClient from "@/app/lib/api-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export type CreateShipDialogHandle = {
    show: () => void;
}

const CreateShipDialog = React.forwardRef<CreateShipDialogHandle, object>((_, ref) => {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const modelSchema = z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        imo: z.string().optional()
    });
    type modelType = z.infer<typeof modelSchema>;

    const { 
        register, 
        handleSubmit, formState: { errors, isSubmitting }, reset 
    } = useForm({ resolver: zodResolver(modelSchema) });

    React.useImperativeHandle(ref, () => ({
        show: () => {
            reset();
            setOpen(true);
        }
    }));

    const onSubmit = async (data: modelType) => {
        const response = await apiClient.post<{ id: string }>("/ships", data);
        setOpen(false);
        router.push(`/ships/${response.data.id}`);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Ship</DialogTitle>
                    <DialogDescription>Add a new ship to your fleet.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    {JSON.stringify(errors)}
                    <Field>
                        <FieldLabel>Name</FieldLabel>
                        <Input placeholder="Enter ship name" {...register("name")} autoComplete="off" />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </Field>
                    <Field>
                        <FieldLabel>IMO Number</FieldLabel>
                        <Input placeholder="Enter IMO number" {...register("imo")} autoComplete="off" />
                        {errors.imo && <p className="text-sm text-red-500">{errors.imo.message}</p>}
                    </Field>
                    <Field>
                        <FieldLabel>Description</FieldLabel>
                        <Textarea placeholder="Enter description" {...register("description")} autoComplete="off" />
                        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                    </Field>
                </form>

                <DialogFooter>
                    <Button variant={"secondary"} onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!!Object.keys(errors).length || isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
});

CreateShipDialog.displayName = 'CreateShipDialog';

export default CreateShipDialog;
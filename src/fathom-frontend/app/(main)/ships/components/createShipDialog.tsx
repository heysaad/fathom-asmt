import apiClient from "@/app/lib/api-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { redirect, useRouter } from "next/navigation";
import React from "react";

export type CreateShipDialogHandle = {
    show: () => void;
}

export default React.forwardRef<CreateShipDialogHandle, {}>((_, ref) => {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [data, setData] = React.useState<{
        name?: string,
        description?: string,
        imo?: string
    }>({});

    React.useImperativeHandle(ref, () => ({
        show: () => {
            setData({});
            setOpen(true);
        }
    }));

    const onSubmit = async () => {
        let response = await apiClient.post<{ id: string }>("/ships", data);
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

                <div className="space-y-3">
                    <div>
                        <Field>
                            <FieldLabel>Name</FieldLabel>
                            <Input placeholder="Enter ship name" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
                            <FieldDescription>Unique name for the ship.</FieldDescription>
                        </Field>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant={"secondary"} onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={onSubmit}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
});
"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const userSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    designation: z.string().optional(),
    role: z.enum(["admin", "crew"]),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
    defaultValues?: Partial<UserFormValues>;
    onSubmit: (values: UserFormValues) => Promise<void>;
    submitLabel: string;
    cancelLabel?: string;
    onCancel: () => void;
}

export default function UserForm({
    defaultValues,
    onSubmit,
    submitLabel,
    cancelLabel = "Cancel",
    onCancel,
}: UserFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            role: "crew",
            ...defaultValues,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">

                <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input placeholder="Jane Doe" {...register("name")} autoComplete="name" />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </Field>

                <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input placeholder="jane@example.com" {...register("email")} autoComplete="email" />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </Field>

                <Field>
                    <FieldLabel>Designation</FieldLabel>
                    <Input placeholder="Chief Officer" {...register("designation")} autoComplete="organization" />
                </Field>

                <Field>
                    <FieldLabel>Role</FieldLabel>
                    <select
                        className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        {...register("role")}
                    >
                        <option value="admin">Admin</option>
                        <option value="crew">Crew</option>
                    </select>
                </Field>
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : submitLabel}
                </Button>
                <Button variant="secondary" type="button" onClick={onCancel}>
                    {cancelLabel}
                </Button>
            </div>
        </form>
    );
}

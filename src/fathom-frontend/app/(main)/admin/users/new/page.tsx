"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import apiClient from "@/app/lib/api-client";

const modelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  designation: z.string().optional(),
  role: z.enum(["admin", "crew"]),
});

type FormValues = z.infer<typeof modelSchema>;

export default function CreateUserPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues: { role: "crew" },
  });

  const onSubmit = async (data: FormValues) => {
    await apiClient.post("/users", data);
    router.push("/admin/users");
  };

  return (
    <div className="container max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="page-title">New User</h2>
          <p className="text-sm text-muted-foreground">Create a user with the default password admin123.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
          <Button variant="secondary" type="button" onClick={() => router.push("/admin/users")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

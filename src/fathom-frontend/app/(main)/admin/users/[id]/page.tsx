"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  Loader2Icon,
  MailIcon,
  PencilIcon,
  ShieldCheckIcon,
  ShipIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react";

import apiClient from "@/app/lib/api-client";
import { getAvatarUrl } from "@/app/lib/helpers";
import { DateFormat } from "@/components/libs/moment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, ScoreBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserForm from "../components/UserForm";
import { UserDetailsVM, UserVM } from "../models";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="w-1/2 text-muted-foreground">{label}</div>
      <div className="text-left">{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

export default function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetailsVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<UserDetailsVM>(`/users/${userId}`);
        setUser(response.data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const handleUpdate = async (values: {
    name: string;
    email: string;
    designation?: string;
    role: "admin" | "crew";
  }) => {
    const response = await apiClient.put<UserVM>(`/users/${userId}`, values);
    setUser((current) =>
      current
        ? {
            ...current,
            ...response.data,
            summary: current.summary,
            ship_assignments: current.ship_assignments,
          }
        : current,
    );
    setShowEditDialog(false);
  };

  const handleDelete = async () => {
    await apiClient.delete(`/users/${userId}`);
    router.push("/admin/users");
  };

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="text-xl font-semibold">User not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This user record may have been removed.
        </p>
        <Button asChild className="mt-5" variant="outline">
          <Link href="/admin/users">
            <ArrowLeftIcon className="size-4" />
            Back to users
          </Link>
        </Button>
      </div>
    );
  }

  const displayName = user.name || user.email;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/users">
            <ArrowLeftIcon className="size-4" />
            Users
          </Link>
        </Button>
      </div>

      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar className="mt-2" size="lg">
            <AvatarImage src={getAvatarUrl(displayName)} />
            <AvatarFallback>
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">
              {displayName}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MailIcon className="size-4" />
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditDialog(true)}
          >
            <PencilIcon className="size-4" />
            Edit
          </Button>
          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2Icon className="size-4" />
              Delete
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete user?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the user and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    handleDelete();
                  }}
                >
                  Delete user
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit user details</DialogTitle>
            <DialogDescription>
              Update profile information and access level for this user.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            defaultValues={{
              name: user.name ?? "",
              email: user.email,
              designation: user.designation ?? "",
              role: user.role,
            }}
            onSubmit={handleUpdate}
            submitLabel="Save changes"
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Active vessels"
            value={user.summary.active_ship_assignments}
            helper={`${user.summary.assigned_ships} total assignments`}
          />
          <Metric
            label="Open tasks"
            value={
              user.summary.scheduled_tasks + user.summary.in_progress_tasks
            }
            helper={`${user.summary.overdue_tasks} overdue`}
          />
          <Metric
            label="Completed tasks"
            value={user.summary.completed_tasks}
            helper="Assigned maintenance"
          />
          <Metric
            label="Drills created"
            value={user.summary.drills_created}
            helper="Safety drill records"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Name" value={displayName} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Designation" value={user.designation || '-'} />
              <InfoRow
                label="Role"
                value={<span className="capitalize">{user.role}</span>}
              />
              <InfoRow
                label="Created"
                value={<DateFormat date={user.created_at ?? undefined} />}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vessel Assignments</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {user.ship_assignments.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  No vessel assignments have been added for this user.
                </div>
              ) : (
                user.ship_assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <ShipIcon className="size-4 text-muted-foreground" />
                        <Link
                          href={`/ships/${assignment.ship_id}`}
                          className="font-medium hover:underline"
                        >
                          {assignment.ship?.name || "Unknown vessel"}
                        </Link>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Assigned{" "}
                        <DateFormat date={assignment.created_at ?? undefined} />
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-muted-foreground">
                        <div>
                          Tasks {assignment.tasks_completed ?? 0}/
                          {assignment.tasks_total ?? 0}
                        </div>
                        <div>
                          Drills {assignment.drills_attended ?? 0}/
                          {assignment.drills_total ?? 0}
                        </div>
                      </div>
                      <ScoreBadge
                        score={assignment.compliance_score ?? undefined}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { use, useEffect, useState } from "react";
import apiClient from "@/app/lib/api-client";
import { useRouter } from "next/navigation";
import UserForm from "../components/UserForm";
import { UserVM } from "../models";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = use(params);
  const router = useRouter();
  const [user, setUser] = React.useState<UserVM | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<UserVM>(`/users/${userId}`);
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
    await apiClient.put(`/users/${userId}`, values);
    router.push("/admin/users");
  };

  const handleDelete = async () => {
    await apiClient.delete(`/users/${userId}`);
    router.push("/admin/users");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found.</div>;
  }

  return (
    <div className="container max-w-xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Edit User</h2>
          <p className="text-sm text-muted-foreground">Update user details or remove this user.</p>
        </div>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            Delete user
          </Button>
        </AlertDialog>
      </div>

      <Card>
        <CardContent>
          <UserForm
            defaultValues={{
              name: user.name ?? "",
              email: user.email,
              designation: user.designation ?? "",
              role: user.role,
            }}
            onSubmit={handleUpdate}
            submitLabel="Save changes"
            onCancel={() => router.push("/admin/users")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

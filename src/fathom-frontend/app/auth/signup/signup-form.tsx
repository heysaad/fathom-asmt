"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import axios from "axios";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { config } from "@/app/lib/config";
import { ensureSuccess } from "@/app/lib/helpers";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const modelSchema = z.object({
    email: z.email(),
    password: z.string().min(5),
  });

  type modelType = z.infer<typeof modelSchema>;
  const {
    register,
    reset,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm({ resolver: zodResolver(modelSchema) });

  const router = useRouter();

  const onSubmit = async (data: modelType) => {
    const response = await axios.post(`${config.apiUrl}/auth/register`, data);
    ensureSuccess(response);
    router.push("/auth/login");
    toast.success("Account created successfully");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create Account</CardTitle>
          <CardDescription>Secure Access to Fathom Marine.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Username</FieldLabel>
                <Input
                  {...register("email")}
                  placeholder="Enter your username"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input type="password" {...register("password")} />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing.." : "Signup"}
                </Button>
                <FieldDescription className="text-center">
                  Want to use existing account? <a href="/auth/login">Login</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

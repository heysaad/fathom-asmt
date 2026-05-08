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
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/app/lib/api-client";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useUser } from "@/app/lib/user-context";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const modelSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  });
  type modelType = z.infer<typeof modelSchema>;

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const { refreshUser } = useUser();

  const {
    handleSubmit,
    register,
    formState: { isSubmitting, errors },
  } = useForm({ resolver: zodResolver(modelSchema) });
  const onSubmit = async (data: modelType) => {
    try {
      const params = new URLSearchParams();
      params.append('username', data.username);
      params.append('password', data.password);
      const response = await apiClient.post("/auth/jwt/login", params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const { access_token } = response.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("token_timestamp", Date.now().toString());
      refreshUser()
      router.push(returnUrl);
    } catch (error) {
      console.error("Login failed:", error);
      toast.error('Invalid username or password')
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Secure Access to Fathom Marine.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...register("username")}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  type="password"
                  {...register("password")}
                  required
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/auth/signup">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}

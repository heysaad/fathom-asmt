"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./lib/user-context";

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "admin") {
      router.push("/dashboard");
      return;
    }

    router.push("/dashboard/crew");
  }, [router, user?.role]);

  return (
    <div></div>
  );
}

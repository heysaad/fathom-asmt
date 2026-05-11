"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./lib/user-context";

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
      router.push("/dashboard");
  }, [router, user?.role]);

  return (
    <div></div>
  );
}

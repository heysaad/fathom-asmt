"use client";

import { useRouter } from "next/navigation";
import { useUser } from "./lib/user-context";

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  if(user?.role == "admin")
    router.push("/dashboard")
  else
    router.push("/dashboard/crew")

  return (
    <div></div>
  );
}

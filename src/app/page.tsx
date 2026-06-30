"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getDefaultRouteForRole } from "@/lib/auth/permissions";
import type { UserRoleType } from "@/types/auth";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: UserRoleType } | undefined)?.role;
    router.push(getDefaultRouteForRole(role));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="flex flex-1 w-full bg-black space-x-3 rounded-r-2xl"></div>
  );
}

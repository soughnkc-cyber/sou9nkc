"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (session) {
      const role = (session.user as any)?.role;
      const roleRoutes: Record<string, string> = {
        ADMIN: "/admin",
        SUPERVISOR: "/supervisor",
        AGENT: "/agent",
        AGENT_TEST: "/agent",
      };

      const targetPath = roleRoutes[role];
      router.replace(targetPath);
    } else {
      router.replace("/auth/signin");
    }
  }, [session, status, router]);

  return null;
}

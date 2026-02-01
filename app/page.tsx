"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (status === "loading") return;
      
      if (!session) {
        router.replace("/auth/signin");
        return;
      }

      try {
        const dbUser = await getMe();
        if (dbUser && dbUser.canViewDashboard) {
          setHasPermission(true);
          const role = dbUser.role;
          const roleRoutes: Record<string, string> = {
            ADMIN: "/admin",
            SUPERVISOR: "/supervisor",
            AGENT: "/list/orders",
            AGENT_TEST: "/list/orders",
          };
          router.replace(roleRoutes[role] || "/list/orders");
        } else {
          setHasPermission(false);
        }
      } catch (err) {
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hasPermission === false) {
    return <PermissionDenied />;
  }

  return null;
}

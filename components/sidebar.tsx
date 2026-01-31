"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getMe } from "@/lib/actions/users";
import { SidebarContent } from "./sidebar-content";

type Role = "ADMIN" | "AGENT" | "SUPERVISOR" | "AGENT_TEST";

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      getMe().then(user => {
        setDbUser(user);
      });
    }
  }, [status, pathname]);



  const userRole = (dbUser?.role || (session?.user as any)?.role) as Role;
  const permissions = dbUser || (session?.user as any) || {};

  const handleSignOut = () => signOut({ callbackUrl: "/auth/signin" });

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-30 bg-white border-r transition-all duration-500 ease-in-out shadow-sm",
          isCollapsed ? "w-[80px]" : "w-64"
        )}>
        <div className="relative h-full flex flex-col">
            <SidebarContent 
                isCollapsed={isCollapsed} 
                mobile={false} 
                userRole={userRole} 
                permissions={permissions} 
                handleSignOut={handleSignOut}
            />
            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border bg-white shadow-sm transition-transform hover:scale-110 z-50 flex items-center justify-center"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
        </div>
      </div>
    </>
  );
}

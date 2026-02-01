"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getMe } from "@/lib/actions/users";
import { SidebarContent } from "./sidebar-content";

import { Sheet, SheetContent } from "@/components/ui/sheet";

type Role = "ADMIN" | "AGENT" | "SUPERVISOR" | "AGENT_TEST";

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (value: boolean) => void;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // 1. Initialize synchronously to avoid first-render flicker
  const [dbUser, setDbUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("sou9nkc_user_data");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return null;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      getMe().then(user => {
        if (user) {
            setDbUser(user);
            localStorage.setItem("sou9nkc_user_data", JSON.stringify(user));
        }
      });
    }
  }, [status, pathname]);



  const userRole = (dbUser?.role || (session?.user as any)?.role) as Role;
  let permissions = dbUser || (session?.user as any) || {};

  // 🛡️ Fallback for Desktop too
  if (userRole && permissions.canViewOrders === undefined) {
      const defaults: any = {
        ADMIN: { canViewOrders: true, canViewUsers: true, canViewProducts: true, canViewStatuses: true, canViewReporting: true, canViewDashboard: true },
        SUPERVISOR: { canViewOrders: true, canViewProducts: true, canViewReporting: true, canViewDashboard: true, canViewUsers: false },
        AGENT: { canViewOrders: true, canViewDashboard: true },
        AGENT_TEST: { canViewOrders: true, canViewDashboard: true },
      };
      permissions = { ...(defaults[userRole] || {}), ...permissions };
  }

  const handleSignOut = () => {
    localStorage.removeItem("sou9nkc_user_data");
    signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <>
      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-72" showCloseButton={false}>
          <SidebarContent 
            isCollapsed={false} 
            mobile={true} 
            userRole={userRole} 
            permissions={permissions} 
            handleSignOut={handleSignOut} 
            onNavigate={() => setIsMobileOpen?.(false)}
          />
        </SheetContent>
      </Sheet>

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

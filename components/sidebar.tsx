"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ShoppingCart,
  ShieldCheck,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react"; // Ajout de l'icône User
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Supprimé AvatarImage
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

// Définition des rôles
type Role = "ADMIN" | "AGENT" | "SUPERVISOR" | "AGENT_TEST";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const navigationItems: NavItem[] = [
  {
    name: "Dashboard Admin",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  {
    name: "Dashboard Agent",
    href: "/agent",
    icon: LayoutDashboard,
    roles: ["AGENT", "AGENT_TEST"],
  },
  {
    name: "Dashboard Superviseur",
    href: "/supervisor",
    icon: LayoutDashboard,
    roles: ["SUPERVISOR"],
  },
  {
    name: "Utilisateurs",
    href: "/list/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    name: "Commandes",
    href: "/list/orders",
    icon: ShoppingCart,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    name: "Reporting",
    href: "/list/reporting",
    icon: BarChart3,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    name: "Status",
    href: "/list/status",
    icon: ShieldCheck,
    roles: ["ADMIN"],
  },
];

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Loading state
  if (status === "loading" || !mounted) {
    return (
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30 w-64 bg-background border-r">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Si pas connecté, ne rien afficher
  if (!session?.user) {
    return null;
  }

  const userRole = (session.user as any).role as Role;
  const filteredNavigation = navigationItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => {
    // En mode mobile, on affiche toujours les labels (expanded)
    // En mode desktop, on respecte l'état isCollapsed
    const showLabels = mobile ? true : !isCollapsed;
    const showAvatarInfo = mobile ? true : !isCollapsed;
    
    return (
      <div className="flex flex-col h-full bg-background border-r">
        {/* Header */}
        <div className={cn(
          "flex items-center p-4 h-16", 
          mobile ? "gap-3" : (isCollapsed ? "justify-center" : "gap-3")
        )}>
          <Avatar className="h-10 w-10 border-2 border-primary/10">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          
          {showAvatarInfo && (
            <div className="flex flex-col overflow-hidden transition-all duration-300">
              <span className="font-semibold truncate text-sm">
                {session.user?.name}
              </span>
              <span className="text-xs text-muted-foreground truncate font-medium">
                {userRole}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-4 px-2">
          <nav className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href);
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  asChild
                  className={cn(
                    "w-full justify-start h-11",
                    isActive && "bg-secondary font-medium text-secondary-foreground",
                    mobile ? "px-3" : (isCollapsed ? "px-2 justify-center" : "px-3")
                  )}
                  title={mobile ? undefined : (isCollapsed ? item.name : undefined)}
                >
                  <Link href={item.href}>
                    <item.icon className={cn("h-5 w-5 shrink-0", showLabels && "mr-3")} />
                    {showLabels && <span className="truncate">{item.name}</span>}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <Separator />

        {/* Footer */}
        <div className="p-3 space-y-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 h-11",
              mobile ? "px-3" : (isCollapsed ? "px-2 justify-center" : "px-3")
            )}
            onClick={handleSignOut}
            title={mobile ? undefined : (isCollapsed ? "Déconnexion" : undefined)}
          >
            <LogOut className={cn("h-5 w-5 shrink-0", showLabels && "mr-3")} />
            {showLabels && <span>Déconnexion</span>}
          </Button>

          {!mobile && (
            <Button
              variant="outline"
              size="icon"
              className="w-full h-9 hidden lg:flex"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-30 bg-background border-r transition-all duration-300",
          isCollapsed ? "w-[70px]" : "w-64"
        )}>
        <SidebarContent mobile={false} />
      </div>

      {/* Mobile Sidebar Trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="fixed top-4 left-4 z-50 bg-background shadow-sm border"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent mobile={true} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, Users, BarChart3, ShoppingCart, ShieldCheck, LogOut, 
  Search, ChevronRight, Command, Package, HelpCircle, Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "next-auth/react";

type Role = "ADMIN" | "AGENT" | "SUPERVISOR" | "AGENT_TEST";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  permission?: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: "MENU PRINCIPAL",
    items: [
      {
        name: "Tableau de Bord",
        href: "/admin",
        icon: LayoutDashboard,
        roles: ["ADMIN"],
        permission: "canViewDashboard",
      },
      {
        name: "Espace Agent",
        href: "/agent",
        icon: LayoutDashboard,
        roles: ["AGENT", "AGENT_TEST"],
        permission: "canViewDashboard",
      },
      {
        name: "Espace Superviseur",
        href: "/supervisor",
        icon: LayoutDashboard,
        roles: ["SUPERVISOR"],
        permission: "canViewDashboard",
      },
      {
        name: "Commandes",
        href: "/list/orders",
        icon: ShoppingCart,
        roles: ["ADMIN", "SUPERVISOR", "AGENT", "AGENT_TEST"],
        permission: "canViewOrders",
      },
      {
        name: "Produits",
        href: "/list/products",
        icon: Package,
        roles: ["ADMIN", "SUPERVISOR"],
        permission: "canViewProducts",
      },
    ],
  },
  {
    title: "OUTILS",
    items: [
      {
        name: "Utilisateurs",
        href: "/list/users",
        icon: Users,
        roles: ["ADMIN"],
        permission: "canViewUsers",
      },
      {
        name: "Analytiques",
        href: "/list/reporting",
        icon: BarChart3,
        roles: ["ADMIN", "SUPERVISOR"],
        permission: "canViewReporting",
      },
      {
        name: "Statuts",
        href: "/list/status",
        icon: ShieldCheck,
        roles: ["ADMIN"],
        permission: "canViewStatuses",
      },
    ],
  },
];

export function SidebarContent({ 
  isCollapsed, 
  mobile = false,
  userRole,
  permissions,
  handleSignOut
}: { 
  isCollapsed: boolean; 
  mobile?: boolean;
  userRole: Role;
  permissions: any;
  handleSignOut: () => void;
}) {
  const pathname = usePathname();
  const showLabels = mobile ? true : !isCollapsed;
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Workspace Branding */}
      <div className={cn("p-4", isCollapsed && !mobile ? "items-center px-0" : "")}>
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg border bg-gray-50/50",
          isCollapsed && !mobile && "justify-center border-none bg-transparent"
        )}>
          <div className="h-10 w-10 rounded-md bg-[#1F30AD] flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
            <span className="text-white font-bold text-xl leading-none">S</span>
          </div>
          {showLabels && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="font-bold text-sm truncate uppercase tracking-tight">Sou9nkc</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Plateforme</span>
            </div>
          )}
          {showLabels && (
              <div className="flex items-center opacity-30">
                  <ChevronRight className="h-4 w-4" />
              </div>
          )}
        </div>
      </div>

      {/* Global Search in Sidebar */}
      {/* <div className={cn("px-4 pb-4", isCollapsed && !mobile && "hidden")}>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
          <Input 
            placeholder="Search..." 
            className="pl-9 h-10 bg-gray-50 border-gray-100 hover:bg-gray-100/50 focus:bg-white transition-all text-sm rounded-xl"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
              <kbd className="h-5 px-1 rounded border bg-white flex items-center justify-center text-[10px] font-sans text-gray-400"><Command className="h-2 w-2 mr-0.5" />K</kbd>
          </div>
        </div>
      </div> */}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-auto px-4 py-2 space-y-6 scrollbar-hide">
        {navigationSections.map((section) => {
          const visibleItems = section.items.filter(item => {
            const hasRole = item.roles.includes(userRole);
            if (!hasRole) return false;
            if (item.permission) return permissions[item.permission] === true;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {showLabels && (
                <h3 className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href);
                  return (
                    <Button
                      key={item.href}
                      variant="ghost"
                      asChild
                      className={cn(
                        "w-full justify-start h-10 px-3 relative group transition-all duration-200",
                        isActive ? "bg-gray-50 text-black font-semibold shadow-sm" : "text-gray-500 hover:text-black hover:bg-gray-50/50",
                        isCollapsed && !mobile ? "px-0 justify-center" : "rounded-xl"
                      )}
                      title={isCollapsed && !mobile ? item.name : undefined}
                    >
                      <Link href={item.href}>
                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#1F30AD] rounded-r-full" />
                        )}
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors", 
                          isActive ? "text-black" : "text-gray-400 group-hover:text-black",
                          showLabels && "mr-3"
                        )} />
                        {showLabels && <span className="text-sm">{item.name}</span>}
                        {showLabels && item.badge && (
                          <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* System Settings & Footer */}
      <div className="mt-auto px-4 py-4 space-y-1">
        {/* {[
          { name: "Support", icon: HelpCircle, href: "#" },
          { name: "Paramètres", icon: Settings, href: "#" },
        ].map((link) => (
          <Button
            key={link.name}
            variant="ghost"
            asChild
            className={cn(
              "w-full justify-start h-9 px-3 text-gray-500 hover:text-black hover:bg-gray-50/50",
              isCollapsed && !mobile ? "px-0 justify-center" : "rounded-xl"
            )}
          >
            <Link href={link.href}>
              <link.icon className={cn("h-4 w-4 shrink-0", showLabels && "mr-3 text-gray-400")} />
              {showLabels && <span className="text-sm font-medium">{link.name}</span>}
            </Link>
          </Button>
        ))} */}

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 h-10 mt-2",
            isCollapsed && !mobile ? "px-0 justify-center" : "px-3 rounded-xl"
          )}
          onClick={handleSignOut}
        >
          <LogOut className={cn("h-4 w-4 shrink-0", showLabels && "mr-3")} />
          {showLabels && <span className="text-sm border-none shadow-none">Déconnexion</span>}
        </Button>
      </div>
    </div>
  );
}

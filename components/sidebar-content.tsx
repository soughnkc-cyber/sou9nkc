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
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

type Role = "ADMIN" | "AGENT" | "SUPERVISOR" | "AGENT_TEST";

interface NavItem {
  id: string; // Added id for translation key
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  permission?: string;
  badge?: string;
}

interface NavSection {
  id: string; // Added id for translation key
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    id: "main",
    title: "MENU PRINCIPAL",
    items: [
      {
        id: "dashboard",
        name: "Tableau de Bord",
        href: "/admin",
        icon: LayoutDashboard,
        roles: ["ADMIN"],
        permission: "canViewDashboard",
      },
      {
        id: "agentSpace",
        name: "Espace Agent",
        href: "/agent",
        icon: LayoutDashboard,
        roles: ["AGENT", "AGENT_TEST"],
        permission: "canViewDashboard",
      },
      {
        id: "supervisorSpace",
        name: "Espace Superviseur",
        href: "/supervisor",
        icon: LayoutDashboard,
        roles: ["SUPERVISOR"],
        permission: "canViewDashboard",
      },
      {
        id: "orders",
        name: "Commandes",
        href: "/list/orders",
        icon: ShoppingCart,
        roles: ["ADMIN", "SUPERVISOR", "AGENT", "AGENT_TEST"],
        permission: "canViewOrders",
      },
      {
        id: "products",
        name: "Produits",
        href: "/list/products",
        icon: Package,
        roles: ["ADMIN", "SUPERVISOR"],
        permission: "canViewProducts",
      },
    ],
  },
  {
    id: "tools",
    title: "OUTILS",
    items: [
      {
        id: "users",
        name: "Utilisateurs",
        href: "/list/users",
        icon: Users,
        roles: ["ADMIN"],
        permission: "canViewUsers",
      },
      {
        id: "analytics",
        name: "Analytiques",
        href: "/list/reporting",
        icon: BarChart3,
        roles: ["ADMIN", "SUPERVISOR"],
        permission: "canViewReporting",
      },
      {
        id: "status",
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
  userRole: propRole,
  permissions: propPermissions,
  handleSignOut,
  onNavigate
}: { 
  isCollapsed: boolean; 
  mobile?: boolean;
  userRole: Role;
  permissions: any;
  handleSignOut: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [forceUpdate, setForceUpdate] = useState(0);
  const t = useTranslations("Navigation");

  // Force a re-render 100ms after mount to capture any late local storage or session hydration
  // This is critical for mobile production environments where hydration can be tricky.
  useEffect(() => {
    const timer = setTimeout(() => setForceUpdate(prev => prev + 1), 100);
    return () => clearTimeout(timer);
  }, []);

  const showLabels = mobile ? true : !isCollapsed;
  
  // High Resiliency Role: Props -> Session -> LocalStorage (Direct sync read)
  const getEffectiveRole = () => {
    if (propRole) return propRole;
    if ((session?.user as any)?.role) return (session?.user as any)?.role;
    
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("sou9nkc_user_data");
      if (cached) {
        try {
            const parsed = JSON.parse(cached);
            return parsed.role || parsed.user?.role;
        } catch(e) {}
      }
    }
    return null;
  };

  const effectiveRole = getEffectiveRole();
  const permissions = propPermissions || (session?.user as any) || {};
  
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

      {/* Language Switcher - Moved for prominence */}
      <div className={cn("px-4 pb-4 border-b mx-2", isCollapsed && !mobile && "hidden")}>
        <LanguageSwitcher />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-auto px-4 py-2 space-y-6 scrollbar-hide">
        {navigationSections.map((section) => {
          const visibleItems = section.items.filter(item => {
            const roleToCheck = effectiveRole; 
            if (!roleToCheck) return false;

            const hasRole = item.roles.includes(roleToCheck);
            if (!hasRole) return false;
            
            if (item.permission && permissions[item.permission] === false) {
                return false;
            }
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.id} className="space-y-1">
              {showLabels && (
                <h3 className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">
                  {t(`sections.${section.id}`)}
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
                      title={isCollapsed && !mobile ? t(`items.${item.id}`) : undefined}
                    >
                      <Link href={item.href} onClick={() => mobile && onNavigate?.()}>
                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#1F30AD] rounded-r-full" />
                        )}
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors", 
                          isActive ? "text-black" : "text-gray-400 group-hover:text-black",
                          showLabels && "mr-3"
                        )} />
                        {showLabels && <span className="text-sm">{t(`items.${item.id}`)}</span>}
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
      <div className="px-4 py-4 space-y-1 border-t">
        {effectiveRole === "ADMIN" ? (
          <Button
            variant="ghost"
            asChild
            className={cn(
              "w-full justify-start h-9 px-3 text-gray-500 hover:text-black hover:bg-gray-50/50",
              isCollapsed && !mobile ? "px-0 justify-center" : "rounded-xl"
            )}
          >
            <Link href="/settings" onClick={() => mobile && onNavigate?.()}>
              <Settings className={cn("h-4 w-4 shrink-0", showLabels && "mr-3 text-gray-400")} />
              {showLabels && <span className="text-sm font-medium">{t("items.settings")}</span>}
            </Link>
          </Button>
        ) : (
          <Button
            variant="ghost"
            asChild
            className={cn(
              "w-full justify-start h-9 px-3 text-gray-500 hover:text-black hover:bg-gray-50/50",
              isCollapsed && !mobile ? "px-0 justify-center" : "rounded-xl"
            )}
          >
            <Link href="/profile" onClick={() => mobile && onNavigate?.()}>
              <ShieldCheck className={cn("h-4 w-4 shrink-0", showLabels && "mr-3 text-gray-400")} />
              {showLabels && <span className="text-sm font-medium">{t("items.profile")}</span>}
            </Link>
          </Button>
        )}

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 h-10 mt-2",
            isCollapsed && !mobile ? "px-0 justify-center" : "px-3 rounded-xl"
          )}
          onClick={handleSignOut}
        >
          <LogOut className={cn("h-4 w-4 shrink-0", showLabels && "mr-3")} />
          {showLabels && <span className="text-sm border-none shadow-none">{t("items.signOut")}</span>}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Bell, User, Settings, Info, CreditCard, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar-content";
import React, { useState, useEffect } from "react";
import { getMe } from "@/lib/actions/users";
import { cn } from "@/lib/utils";

export default function MenuBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [dbUser, setDbUser] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      getMe().then(user => setDbUser(user));
    }
  }, [session]);

  const userRole = (dbUser?.role || (session?.user as any)?.role);
  const permissions = dbUser || (session?.user as any) || {};

  // Get dynamic title based on pathname
  const getPageTitle = () => {
    if (pathname?.includes("/list/orders")) return "Commandes";
    if (pathname?.includes("/list/users")) return "Utilisateurs";
    if (pathname?.includes("/list/status")) return "Status";
    if (pathname?.includes("/list/products")) return "Produits";
    if (pathname?.includes("/list/reporting")) return "Reporting";
    if (pathname?.includes("/admin")) return "Tableau de Bord";
    if (pathname?.includes("/agent")) return "Espace Agent";
    if (pathname?.includes("/supervisor")) return "Espace Superviseur";
    return "Dashboard";
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 sm:h-20 flex items-center justify-between px-3 sm:px-8 sticky top-0 z-20">
      {/* Mobile Menu & Page Title */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="lg:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 rounded-xl">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <SidebarContent 
                        isCollapsed={false} 
                        mobile={true} 
                        userRole={userRole} 
                        permissions={permissions} 
                        handleSignOut={() => signOut({ callbackUrl: "/auth/signin" })} 
                    />
                </SheetContent>
            </Sheet>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">{getPageTitle()}</h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Notifications */}
        {/* <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl h-9 w-9 sm:h-10 sm:w-10">
           <Bell className="h-5 w-5" />
           <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 h-2 w-2 bg-[#1F30AD] rounded-full border-2 border-white"></span>
        </Button> */}

        <div className="h-6 sm:h-8 w-px bg-gray-100 mx-1 sm:mx-2" />

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 cursor-pointer group">
                    <div className="flex-col items-end text-right hidden sm:flex">
                        <span className="text-sm font-bold leading-none group-hover:text-[#1F30AD] transition-colors uppercase">{session?.user?.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{userRole}</span>
                    </div>
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-white ring-2 ring-gray-100 shadow-sm group-hover:ring-blue-200 transition-all">
                        <AvatarFallback className="bg-[#1F30AD] text-white font-bold text-xs uppercase">
                            {session?.user?.name?.substring(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-gray-100 shadow-xl mt-2">
                <DropdownMenuLabel className="font-black text-xs uppercase tracking-widest text-gray-400 px-3 py-2">Mon Compte</DropdownMenuLabel>
                <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer font-bold focus:bg-blue-50 focus:text-[#1F30AD]">
                    <User className="h-4 w-4 mr-2" /> Profil
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer font-bold focus:bg-blue-50 focus:text-[#1F30AD]">
                    <Settings className="h-4 w-4 mr-2" /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-50 mx-2 my-1" />
                <DropdownMenuItem 
                    className="rounded-xl px-3 py-2 cursor-pointer font-bold text-red-600 focus:bg-red-50 focus:text-red-700"
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                >
                    <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

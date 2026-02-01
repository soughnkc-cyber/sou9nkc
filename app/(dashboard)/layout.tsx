"use client";

import Sidebar from "@/components/sidebar";
import MenuBar from "@/components/menubar";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import AuthWrapper from "@/components/authwrapper";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50/30">
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <main
          className={cn(
            "transition-all duration-500 ease-in-out min-h-screen flex flex-col",
            isCollapsed ? "lg:ml-[80px]" : "lg:ml-64"
          )}
        >
          <MenuBar onOpenMobile={() => setIsMobileOpen(true)} />
          <div className="p-2 sm:p-2 flex-1 h-full">
              {children}
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default DashboardLayout;
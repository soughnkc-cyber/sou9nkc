"use client";

import Sidebar from "@/components/sidebar";
import MenuBar from "@/components/menubar";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import AuthWrapper from "@/components/authwrapper";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main
          className={cn(
            "transition-all duration-300 min-h-screen flex flex-col",
            isCollapsed ? "lg:ml-[70px]" : "lg:ml-64"
          )}
        >
          <MenuBar />
          <div className="p-6 flex-1 h-full">
              {children}
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default DashboardLayout;
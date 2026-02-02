"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Phone, ChevronLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getMe } from "@/lib/actions/users";
import { signOut } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [dbUser, setDbUser] = useState<any>(null);

  useEffect(() => {
    getMe().then(user => setDbUser(user));
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("sou9nkc_user_data");
    signOut({ callbackUrl: "/auth/signin" });
  };

  const user = dbUser || (session?.user as any);
  const iconColor = user?.iconColor || "#1F30AD";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 -mt-12">
      {/* Mobile Back Button */}
      <div className="absolute top-4 left-4 lg:hidden">
        <Button variant="ghost" size="icon" asChild className="rounded-full text-gray-500">
            <Link href="/">
                <ChevronLeft className="h-6 w-6" />
            </Link>
        </Button>
      </div>

      <div className="w-full max-w-sm space-y-8 flex flex-col items-center">
        {/* Avatar Section */}
        <div className="relative group">
            <div 
                className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-500 group-hover:opacity-40"
                style={{ backgroundColor: iconColor }}
            />
            <Avatar className="h-32 w-32 border-4 border-white shadow-2xl relative transition-transform duration-500 group-hover:scale-105">
                <AvatarFallback 
                    className="text-white font-black text-4xl uppercase"
                    style={{ backgroundColor: iconColor }}
                >
                    {user?.name?.substring(0, 2)}
                </AvatarFallback>
            </Avatar>
        </div>

        {/* User Info */}
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
                {user?.name}
            </h1>
            <div className="flex items-center justify-center gap-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                <Phone className="h-4 w-4 text-[#1F30AD]" />
                <span className="text-sm font-bold">{user?.phone || 'Non renseigné'}</span>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-4">
            <Button 
                variant="ghost" 
                className="w-full rounded-2xl h-12 font-bold text-red-500 hover:text-red-700 hover:bg-red-50 transition-all"
                onClick={handleSignOut}
            >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
            </Button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Sou9nkc Platform</p>
      </div>
    </div>
  );
}

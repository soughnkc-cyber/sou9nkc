import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function PermissionDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Permission insuffisante</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Désolé, vous n'avez pas les droits nécessaires pour accéder à cette page ou effectuer cette action. 
        Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.
      </p>
      
      <div className="flex gap-4">
        <Button 
          variant="destructive" 
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex gap-2 items-center"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}

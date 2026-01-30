"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Phone, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SignInPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any)?.role;
      const roleRoutes: Record<string, string> = {
        ADMIN: "/admin",
        SUPERVISOR: "/supervisor",
        AGENT: "/agent",
        AGENT_TEST: "/agent",
      };
      const targetPath = roleRoutes[role] || "/accueil";
      router.replace(targetPath);
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        phone,
        password,
      });

      if (result?.error) {
        toast.error("Échec de la connexion", {
          description: getErrorMessage(result.error),
          duration: 3000,
        });
        router.refresh();
      } else if (result?.ok) {
        toast.success("Connexion réussie !", {
          description: "Redirection vers votre espace...",
          duration: 2000,
        });
        router.refresh();
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast.error("Erreur inattendue", {
        description: "Une erreur est survenue. Veuillez réessayer.",
        duration: 3000,
      });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "CredentialsSignin":
        return "Numéro de téléphone ou mot de passe incorrect";
      case "Phone et mot de passe requis":
      case "Aucun compte trouvé avec ce numéro":
      case "Mot de passe incorrect":
        return error;
      default:
        return "Erreur de connexion. Veuillez réessayer.";
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="mt-4 text-slate-600 font-bold uppercase tracking-widest text-[10px]">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-50/50 rounded-full blur-3xl" />
      
      <Card className="max-w-md w-full shadow-2xl rounded-2xl overflow-hidden border-slate-100 bg-white/80 backdrop-blur-sm relative z-10 transition-all duration-500 hover:shadow-orange-500/5">
        <div className="bg-linear-to-br from-orange-500 to-orange-600 p-10 text-white text-center relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <CardTitle className="text-3xl font-black mb-2 tracking-tight">Content de vous revoir</CardTitle>
            <p className="text-orange-50 font-medium text-sm tracking-wide opacity-90">
              Connectez-vous à votre espace personnel
            </p>
          </div>
        </div>
        
        <CardContent className="p-10 pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numéro de téléphone</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0612345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50/30 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500 transition-all placeholder:text-slate-300 font-medium"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</Label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50/30 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500 transition-all placeholder:text-slate-300"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all duration-200 border-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
              En vous connectant, vous accédez à votre <span className="text-slate-900 font-bold">Espace Personnel</span>. 
              <br />
              Un problème ? <span className="text-orange-600 font-bold cursor-pointer hover:underline underline-offset-4">Contactez l'administrateur</span>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

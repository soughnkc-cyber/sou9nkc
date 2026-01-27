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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600 font-medium">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl overflow-hidden border-0">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center">
          <CardTitle className="text-3xl font-bold mb-2">Content de vous revoir</CardTitle>
          <CardDescription className="text-blue-100 text-base">
            Connectez-vous à votre espace
          </CardDescription>
        </div>
        
        <CardContent className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                  <Phone className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0612345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-11" // h-11 makes it slightly taller for better mobile touch
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                  <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white h-11 font-semibold text-base shadow-md transition-all duration-200"
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

          <p className="text-center text-gray-500 text-sm mt-6">
            En vous connectant, vous accédez à votre{" "}
            <span className="text-gray-700 font-medium">Espace Personnel</span>. 
            Pour tout problème, contactez{" "}
            <span className="text-gray-700 font-medium cursor-pointer hover:underline">
              l'administrateur
            </span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

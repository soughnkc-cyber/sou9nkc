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
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

export default function SignInPage() {
  const t = useTranslations("Auth");
  const locale = useLocale();
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
        AGENT: "/list/orders",
        AGENT_TEST: "/list/orders",
      };
      const targetPath = roleRoutes[role] || "/list/orders";
      
      // 🛡️ Seed local storage BEFORE redirect to ensure zero-latency hydration on next page
      localStorage.setItem("sou9nkc_user_data", JSON.stringify(session.user));
      
      // Force hard navigation to ensure sidebar session state is synced
      window.location.href = targetPath;
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
        toast.error(t('loginError'), {
          description: getErrorMessage(result.error),
          duration: 3000,
        });
        router.refresh();
      } else if (result?.ok) {
        toast.success(t('loginSuccess'), {
          description: t('redirecting'),
          duration: 2000,
        });
        router.refresh();
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast.error(t('unexpectedError'), {
        description: t('errorTryAgain'),
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
        return t('errors.invalidCredentials');
      case "Phone et mot de passe requis":
        return t('errors.requiredFields');
      case "Aucun compte trouvé avec ce numéro":
        return t('errors.accountNotFound');
      case "Mot de passe incorrect":
        return t('errors.wrongPassword');
      default:
        return t('errors.generic');
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-[#1F30AD] animate-spin" />
          <p className="mt-4 text-slate-600 font-bold uppercase tracking-widest text-[10px]">{t('sessionChecking')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-3xl" />
      
      {/* Absolute Language Switcher */}
      <div className="absolute top-6 end-6 z-50 bg-white/50 backdrop-blur-md px-3 py-1 rounded-full border border-white shadow-sm">
        <LanguageSwitcher />
      </div>

      <Card className="max-w-md w-full shadow-2xl rounded-2xl overflow-hidden border-slate-100 bg-white/80 backdrop-blur-sm relative z-10 transition-all duration-500 hover:shadow-[#1F30AD]/5">
        <div className="bg-linear-to-br from-[#1F30AD] to-[#172585] p-10 text-white text-center relative overflow-hidden">
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
            <CardTitle className="text-3xl font-black mb-2 tracking-tight">{t('welcomeTitle')}</CardTitle>
            <p className="text-blue-50 font-medium text-sm tracking-wide opacity-90">
              {t('welcomeSubtitle')}
            </p>
          </div>
        </div>
        
        <CardContent className="p-10 pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('phoneLabel')}</Label>
              <div className="relative group">
                <div className={cn(
                    "absolute inset-y-0 flex items-center pointer-events-none",
                    locale === 'ar' ? "right-0 pr-4" : "left-0 pl-4"
                )}>
                  <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-[#1F30AD] transition-colors" />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn(
                    "h-12 rounded-xl border-slate-200 bg-slate-50/30 focus-visible:ring-[#1F30AD] focus-visible:ring-offset-0 focus-visible:border-[#1F30AD] transition-all placeholder:text-slate-300 font-medium",
                    locale === 'ar' ? "pr-12" : "pl-12"
                  )}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('password')}</Label>
              </div>
              <div className="relative group">
                <div className={cn(
                    "absolute inset-y-0 flex items-center pointer-events-none",
                    locale === 'ar' ? "right-0 pr-4" : "left-0 pl-4"
                )}>
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-[#1F30AD] transition-colors" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "h-12 rounded-xl border-slate-200 bg-slate-50/30 focus-visible:ring-[#1F30AD] focus-visible:ring-offset-0 focus-visible:border-[#1F30AD] transition-all placeholder:text-slate-300",
                    locale === 'ar' ? "pr-12" : "pl-12"
                  )}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-[#1F30AD] to-[#172585] hover:from-[#172585] hover:to-[#101A60] text-white h-12 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#1F30AD]/20 active:scale-[0.98] transition-all duration-200 border-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submit')
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
              {t.rich('footerText', {
                space: (chunks) => <span className="text-slate-900 font-bold">{t('spaceLabel')}</span>
              })}
              <br />
              {t('problemLabel')} <span className="text-[#1F30AD] font-bold cursor-pointer hover:underline underline-offset-4">{t('contactAdmin')}</span>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

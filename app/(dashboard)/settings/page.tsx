"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, ChevronLeft, Edit2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getMe, updateMeAction } from "@/lib/actions/users";
import { UserFormModal } from "@/components/forms/user-form-modal";
import { toast } from "sonner";
import { UserFormData } from "@/lib/schema";
import { getSystemSettings, updateSystemSettings } from "@/lib/actions/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [dbUser, setDbUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(1);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [me, settings] = await Promise.all([
        getMe(),
        getSystemSettings()
      ]);
      if (me) setDbUser(me);
      if (settings) {
        setSystemSettings(settings);
        setBatchSize(settings.assignmentBatchSize);
      }
    } catch (error) {
      toast.error("Erreur de chargement des paramètres");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      await updateMeAction(data);
      toast.success("Profil mis à jour avec succès");
      await updateSession();
      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSystem = async () => {
    setIsSavingSystem(true);
    try {
      await updateSystemSettings({ assignmentBatchSize: batchSize });
      toast.success("Paramètres système mis à jour");
      await fetchData();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour système");
    } finally {
      setIsSavingSystem(false);
    }
  };

  const user = dbUser || (session?.user as any);
  const iconColor = user?.iconColor || "#1F30AD";

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-gray-100 border-t-[#1F30AD] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 -mt-12">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full text-gray-400 hover:text-gray-900 transition-colors">
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
        <div className="text-center space-y-3">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Administrateur</p>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
                    {user?.name}
                </h1>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-gray-600 bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100 shadow-sm">
                <Phone className="h-4 w-4 text-[#1F30AD]" />
                <span className="text-sm font-bold">{user?.phone || 'Non renseigné'}</span>
            </div>
        </div>

        {/* Action Button */}
        <div className="w-full pt-4 space-y-4">
            <Button 
                onClick={() => setIsModalOpen(true)}
                className="w-full h-14 rounded-2xl bg-[#1F30AD] hover:bg-[#172585] text-white font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all"
            >
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier mon profil
            </Button>

            {/* System Settings Section (Admin only) */}
            {user?.role === "ADMIN" && (
                <div className="pt-8 border-t border-gray-100 space-y-6 w-full">
                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Attribution des commandes</p>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">PARAMÈTRES SYSTÈME</h2>
                    </div>

                    <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="batchSize" className="text-xs font-bold text-gray-500 uppercase ml-1">Commandes par Agent (Batch)</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="batchSize"
                                    type="number" 
                                    min={1} 
                                    max={100}
                                    value={batchSize}
                                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                                    className="h-12 rounded-xl border-gray-200 font-bold focus:ring-[#1F30AD]"
                                />
                                <Button 
                                    onClick={handleSaveSystem}
                                    disabled={isSavingSystem}
                                    className="h-12 px-6 rounded-xl bg-gray-900 hover:bg-black text-white font-bold transition-all"
                                >
                                    {isSavingSystem ? <RefreshCw className="h-4 w-4 animate-spin" /> : "OK"}
                                </Button>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium px-1">
                                Définit combien de commandes consécutives reçoit un agent avant de passer au suivant.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Editable Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpdate}
        user={dbUser}
        isLoading={isSubmitting}
        isSelfEdit={true}
        title="Modifier mes informations"
        description="Mettez à jour votre nom, numéro de téléphone ou mot de passe."
      />

      {/* Footer Branding */}
      <div className="absolute bottom-10 left-0 right-0 text-center opacity-30">
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Sou9nkc Space</p>
      </div>
    </div>
  );
}

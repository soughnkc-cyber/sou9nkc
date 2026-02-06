"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, ChevronLeft, Edit2, User as UserIcon, RefreshCw } from "lucide-react";
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
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [dbUser, setDbUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [isSavingRecall, setIsSavingRecall] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(1);
  const [maxRecallAttempts, setMaxRecallAttempts] = useState<number>(3);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  
  // Work Schedule State
  const [workStart, setWorkStart] = useState("10:00");
  const [workEnd, setWorkEnd] = useState("22:00");
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [breakStart, setBreakStart] = useState("13:30");
  const [breakEnd, setBreakEnd] = useState("14:30");

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
        setMaxRecallAttempts(settings.maxRecallAttempts);
        setWorkStart(settings.workStart);
        setWorkEnd(settings.workEnd);
        setWorkDays(settings.workDays);
        setBreakStart(settings.breakStart || "");
        setBreakEnd(settings.breakEnd || "");
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
    <div className="min-h-screen flex flex-col items-center pt-6 pb-20 px-4">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full text-gray-400 hover:text-gray-900 transition-colors">
            <Link href="/">
                <ChevronLeft className="h-6 w-6" />
            </Link>
        </Button>
      </div>

      <div className="w-full max-w-sm space-y-6 flex flex-col items-center">
        {/* Avatar Section */}
        <div className="relative group">
            <div 
                className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-500 group-hover:opacity-40"
                style={{ backgroundColor: iconColor }}
            />
            <Avatar className="h-24 w-24 border-4 border-white shadow-2xl relative transition-transform duration-500 group-hover:scale-105">
                <AvatarFallback 
                    className="text-white font-black text-2xl uppercase"
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
                <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
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
                className="w-full h-12 rounded-2xl bg-[#1F30AD] hover:bg-[#172585] text-white font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all"
            >
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier mon profil
            </Button>

            {/* System Settings Section (Admin only) */}
            {user?.role === "ADMIN" && (
                <div className="pt-4 border-t border-gray-100 space-y-4 w-full">
                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Configuration</p>
                        <h2 className="text-sm font-black text-gray-900 tracking-tight uppercase">SYSTÈME</h2>
                    </div>

                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        {/* Batch Size Setting */}
                        <div className="space-y-1.5">
                            <Label htmlFor="batchSize" className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Orders par Agent</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="batchSize"
                                    type="number" 
                                    min={1} 
                                    max={100}
                                    value={batchSize}
                                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                                    className="h-10 w-20 rounded-xl border-gray-100 bg-gray-50/50 text-sm font-bold focus:ring-[#1F30AD] focus:border-[#1F30AD]"
                                />
                                <Button 
                                    onClick={async () => {
                                        setIsSavingBatch(true);
                                        try {
                                            await updateSystemSettings({ assignmentBatchSize: batchSize, maxRecallAttempts });
                                            toast.success("Batch size mis à jour");
                                            await fetchData();
                                        } finally {
                                            setIsSavingBatch(false);
                                        }
                                    }}
                                    disabled={isSavingBatch}
                                    className="h-10 flex-1 rounded-xl bg-[#1F30AD] hover:bg-[#172585] text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    {isSavingBatch ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Appliquer"}
                                </Button>
                            </div>
                        </div>

                        {/* Max Recall Setting */}
                        <div className="space-y-1.5 pt-3 border-t border-gray-50">
                            <Label htmlFor="maxRecall" className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Max Tentatives de Rappel</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="maxRecall"
                                    type="number" 
                                    min={1} 
                                    max={20}
                                    value={maxRecallAttempts}
                                    onChange={(e) => setMaxRecallAttempts(parseInt(e.target.value) || 3)}
                                    className="h-10 w-20 rounded-xl border-gray-100 bg-gray-50/50 text-sm font-bold focus:ring-[#1F30AD] focus:border-[#1F30AD]"
                                />
                                <Button 
                                    onClick={async () => {
                                        setIsSavingRecall(true);
                                        try {
                                            await updateSystemSettings({ assignmentBatchSize: batchSize, maxRecallAttempts });
                                            toast.success("Limite de rappels mise à jour");
                                            await fetchData();
                                        } finally {
                                            setIsSavingRecall(false);
                                        }
                                    }}
                                    disabled={isSavingRecall}
                                    className="h-10 flex-1 rounded-xl bg-[#1F30AD] hover:bg-[#172585] text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    {isSavingRecall ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Appliquer"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-1 pt-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Horaires</p>
                        <h2 className="text-sm font-black text-gray-900 tracking-tight uppercase">TRAVAIL & PAUSES</h2>
                    </div>

                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-4 w-full">
                        {/* Working Hours */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Début Travail</Label>
                                <Input 
                                    type="time" 
                                    value={workStart}
                                    onChange={(e) => setWorkStart(e.target.value)}
                                    className="h-10 rounded-xl border-gray-100 bg-gray-50/50 text-sm font-bold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Fin Travail</Label>
                                <Input 
                                    type="time" 
                                    value={workEnd}
                                    onChange={(e) => setWorkEnd(e.target.value)}
                                    className="h-10 rounded-xl border-gray-100 bg-gray-50/50 text-sm font-bold"
                                />
                            </div>
                        </div>

                        {/* Breaks */}
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Début Pause</Label>
                                <Input 
                                    type="time" 
                                    value={breakStart}
                                    onChange={(e) => setBreakStart(e.target.value)}
                                    className="h-10 rounded-xl border-gray-100 bg-gray-50/50 text-sm font-bold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Fin Pause</Label>
                                <Input 
                                    type="time" 
                                    value={breakEnd}
                                    onChange={(e) => setBreakEnd(e.target.value)}
                                    className="h-10 rounded-xl border-gray-100 bg-gray-50/50 text-sm font-bold"
                                />
                            </div>
                        </div>

                        {/* Working Days */}
                        <div className="pt-3 border-t border-gray-50 space-y-2">
                             <Label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Jours de travail</Label>
                             <div className="flex flex-wrap gap-2">
                                 {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, idx) => (
                                     <button
                                        key={day}
                                        onClick={() => {
                                            setWorkDays(prev => 
                                                prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                                            );
                                        }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border",
                                            workDays.includes(idx) 
                                                ? "bg-[#1F30AD] text-white border-[#1F30AD]" 
                                                : "bg-gray-50 text-gray-400 border-gray-100"
                                        )}
                                     >
                                         {day}
                                     </button>
                                 ))}
                             </div>
                        </div>

                        <Button 
                            onClick={async () => {
                                setIsSavingSchedule(true);
                                try {
                                    await updateSystemSettings({ 
                                        assignmentBatchSize: batchSize, 
                                        maxRecallAttempts,
                                        workStart,
                                        workEnd,
                                        workDays,
                                        breakStart: breakStart || null,
                                        breakEnd: breakEnd || null
                                    });
                                    toast.success("Horaires mis à jour");
                                    await fetchData();
                                } catch (error) {
                                    toast.error("Erreur lors de la sauvegarde");
                                } finally {
                                    setIsSavingSchedule(false);
                                }
                            }}
                            disabled={isSavingSchedule}
                            className="w-full h-11 rounded-xl bg-[#1F30AD] hover:bg-[#172585] text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-50 transition-all mt-2"
                        >
                            {isSavingSchedule ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Sauvegarder les horaires"}
                        </Button>
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


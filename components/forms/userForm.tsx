// app/admin/users/components/user-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { UserFormData, userFormSchema } from "@/lib/schema";
import { User } from "@/app/(dashboard)/list/users/columns";
import { useSession } from "next-auth/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";



interface UserFormProps {
  user?: User | null;
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading?: boolean;
  isEditMode?: boolean;
  isSelfEdit?: boolean;
}

function PermissionCheckbox({ control, name, label, disabled }: { control: any; name: string; label: string; disabled?: boolean }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-row items-start space-x-3 space-y-0 p-2", disabled && "opacity-50")}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="text-sm font-medium cursor-pointer">
              {label}
            </FormLabel>
          </div>
        </FormItem>
      )}
    />
  );
}


export function UserForm({ user, onSubmit, isLoading = false, isEditMode = false, isSelfEdit = false }: UserFormProps) {

  const [showPassword, setShowPassword] = useState(true);

  const form = useForm<any>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      password: user?.decryptedPassword || "",
      role: user?.role || "AGENT_TEST",
      iconColor: user?.iconColor || "#2563eb",
      roleColor: user?.roleColor || "#f3f4f6",
      paymentRemainingDays: user?.paymentRemainingDays ?? 0,
      paymentDefaultDays: user?.paymentDefaultDays ?? 0,
      // Permissions
      canViewOrders: user?.canViewOrders || false,
      canEditOrders: user?.canEditOrders || false,
      canViewUsers: user?.canViewUsers || false,
      canEditUsers: user?.canEditUsers || false,
      canViewProducts: user?.canViewProducts || false,
      canEditProducts: user?.canEditProducts || false,
      canViewStatuses: user?.canViewStatuses || false,
      canEditStatuses: user?.canEditStatuses || false,
      canViewReporting: user?.canViewReporting || false,
      canViewDashboard: user?.canViewDashboard || false,
    },
  });




  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";


  const handleSubmit = async (data: UserFormData) => {
    try {
        if (isEditMode && data.password === "") {
          const { password, ...rest } = data;
          await onSubmit(rest);
        } else {
          await onSubmit(data);
        }
    } catch (error) {
        console.error("Form submission error:", error);
        // The parent usually handles toasts, but we catch here to prevent the white screen crash.
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nom */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    {...field} 
                    value={field.value || ""}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Optionnel
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Téléphone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+212 6 12 34 56 78" 
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Numéro unique pour chaque utilisateur
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mot de passe */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isEditMode ? "Mot de passe (Laisser vide pour conserver)" : "Mot de passe *"}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={isEditMode ? "Laisser vide pour conserver" : "••••••"}
                      {...field}
                      value={field.value || ""}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  {isEditMode 
                    ? "Remplir seulement si vous souhaitez changer le mot de passe"
                    : "Minimum 6 caractères"
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rôle */}
          {!isSelfEdit && (
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                      <SelectItem value="AGENT">Agent</SelectItem>
                      <SelectItem value="SUPERVISOR">Superviseur</SelectItem>
                      <SelectItem value="AGENT_TEST">Agent Test</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Définit les permissions de l'utilisateur
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Couleurs */}
          {!isSelfEdit && (
            <>
              <FormField
                control={form.control}
                name="iconColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur de l'icône</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 items-center">
                        <Input 
                          type="color" 
                          {...field}
                          className="w-12 h-10 p-1 cursor-pointer"
                          disabled={isLoading}
                        />
                        <Input 
                          {...field}
                          placeholder="#2563eb"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur du rôle (Badge)</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 items-center">
                        <Input 
                          type="color" 
                          {...field}
                          className="w-12 h-10 p-1 cursor-pointer"
                          disabled={isLoading}
                        />
                        <Input 
                          {...field}
                          placeholder="#f3f4f6"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Champs admin seulement: Paiement */}
          {isAdmin && !isSelfEdit && (

            <>
              <FormField
                control={form.control}
                name="paymentDefaultDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de jours par défaut (Paiement)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Le cycle total (ex: 30 jours)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentRemainingDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jours restants avant paiement</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Ce nombre se décrémentera (0 = jour de paie)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>


        {/* Permissions Section (Admin only) */}
        {isAdmin && !isSelfEdit && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Permissions pour le rôle {form.watch("role")}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 p-4 bg-gray-50 rounded-lg border">
              {/* Ces permissions sont visibles pour TOUS les rôles */}
              <PermissionCheckbox control={form.control} name="canViewDashboard" label="Voir le Dashboard" />
              <PermissionCheckbox 
                control={form.control} 
                name="canViewOrders" 
                label="Voir Commandes" 
              />
              <PermissionCheckbox 
                control={form.control} 
                name="canEditOrders" 
                label="Modifier Commandes" 
                disabled={form.watch("role") === "ADMIN" || form.watch("role") === "SUPERVISOR"}
              />

              {/* Utilisateurs: ADMIN uniquement */}
              {form.watch("role") === "ADMIN" && (
                <>
                  <div className="col-span-full h-px bg-gray-200 my-1" />
                  <PermissionCheckbox control={form.control} name="canViewUsers" label="Voir Utilisateurs" />
                  <PermissionCheckbox control={form.control} name="canEditUsers" label="Modifier Utilisateurs" />
                </>
              )}

              {/* Produits: ADMIN & SUPERVISOR uniquement */}
              {(form.watch("role") === "ADMIN" || form.watch("role") === "SUPERVISOR") && (
                <>
                  <div className="col-span-full h-px bg-gray-200 my-1" />
                  <PermissionCheckbox control={form.control} name="canViewProducts" label="Voir Produits" />
                  <PermissionCheckbox control={form.control} name="canEditProducts" label="Modifier Produits" />
                </>
              )}

              {/* Status: ADMIN uniquement */}
              {form.watch("role") === "ADMIN" && (
                <>
                  <div className="col-span-full h-px bg-gray-200 my-1" />
                  <PermissionCheckbox control={form.control} name="canViewStatuses" label="Voir Status" />
                  <PermissionCheckbox control={form.control} name="canEditStatuses" label="Modifier Status" />
                </>
              )}

              {/* Reporting: ADMIN & SUPERVISOR uniquement */}
              {(form.watch("role") === "ADMIN" || form.watch("role") === "SUPERVISOR") && (
                <>
                  <div className="col-span-full h-px bg-gray-200 my-1" />
                  <PermissionCheckbox control={form.control} name="canViewReporting" label="Voir le Reporting" />
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 italic">
              * Note: Certaines permissions sont automatiquement masquées car elles ne s'appliquent pas au rôle sélectionné.
            </p>
          </div>
        )}



        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="submit"
            disabled={isLoading}
            className={cn("min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white", isLoading && "opacity-50 cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white")}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                {isEditMode ? "Modification..." : "Ajout..."}
              </>
            ) : (
              <>
                {isEditMode ? "Modifier" : "Ajouter"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
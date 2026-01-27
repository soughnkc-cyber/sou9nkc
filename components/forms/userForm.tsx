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
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { UserFormData, userFormSchema } from "@/lib/schema";
import { User } from "@/app/(dashboard)/list/users/columns";

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading?: boolean;
  isEditMode?: boolean;
}

export function UserForm({ user, onSubmit, isLoading = false, isEditMode = false }: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      password: "",
      role: user?.role || "AGENT_TEST",
    },
  });

  const handleSubmit = async (data: UserFormData) => {
    if (isEditMode && data.password === "") {
      const { password, ...rest } = data;
      await onSubmit(rest);
    } else {
      await onSubmit(data);
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
                  {isEditMode ? "Nouveau mot de passe" : "Mot de passe *"}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={isEditMode ? "••••••" : "••••••"}
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
        </div>

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
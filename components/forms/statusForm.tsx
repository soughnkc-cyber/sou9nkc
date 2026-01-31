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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Status } from "@/app/(dashboard)/list/status/columns";
import { StatusFormData, statusFormSchema, Etat } from "@/lib/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


import { Switch } from "@/components/ui/switch";

interface StatusFormProps {
  status?: Status | null;
  onSubmit: (data: StatusFormData) => Promise<void>;
  isLoading?: boolean;
  isEditMode?: boolean;
}

export function StatusForm({
  status,
  onSubmit,
  isLoading = false,
  isEditMode = false,
}: StatusFormProps) {
  const form = useForm<StatusFormData>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      name: status?.name || "",
      recallAfterH: status?.recallAfterH ?? null,
      color: status?.color || "#6366f1",
      etat: (status?.etat as Etat) || Etat.STATUS_01,
      isActive: status?.isActive ?? true,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nom du statut */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du statut *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="À rappeler / En attente / Clôturé..."
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Nom visible dans l’application
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Etat */}
          <FormField
            control={form.control}
            name="etat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etat Système *</FormLabel>
                <Select
                  disabled={isLoading || isEditMode}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un état systeme" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Etat).map((etat) => (
                      <SelectItem key={etat} value={etat}>
                        {etat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  L'état technique pour les statistiques (01-15)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rappel après X heures */}
          <FormField
            control={form.control}
            name="recallAfterH"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rappel après (heures)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 1, 2, 24"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? null
                          : Number(e.target.value)
                      )
                    }
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Laisser vide si aucun rappel automatique
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Couleur */}
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Couleur</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      className="w-12 h-10 p-1 cursor-pointer"
                      {...field}
                      disabled={isLoading}
                    />
                    <Input
                      placeholder="#000000"
                      className="flex-1"
                      {...field}
                      disabled={isLoading}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Couleur affichée pour ce statut
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Active */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs">
                <div className="space-y-0.5">
                  <FormLabel>Statut Actif</FormLabel>
                  <FormDescription>
                    Désactiver pour masquer ce statut
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

        </div>


        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                {isEditMode ? "Modification..." : "Ajout..."}
              </>
            ) : (
              <>{isEditMode ? "Modifier" : "Ajouter"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

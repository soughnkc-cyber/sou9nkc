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
import { StatusFormData, statusFormSchema } from "@/lib/schema";


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
      recallAfterH: status?.recallAfterH ?? undefined,
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
                    min={1}
                    placeholder="Ex: 1, 2, 24"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
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

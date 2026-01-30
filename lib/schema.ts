// app/admin/users/schemas/user-schema.ts
import * as z from "zod";

export const userFormSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
  phone: z.string()
    .min(8, "Le numéro de téléphone doit contenir au moins 10 chiffres")
    .regex(/^\+?[0-9\s\-\(\)]+$/, "Numéro de téléphone invalide"),
  password: z.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .optional()
    .or(z.literal("")),
  role: z.enum(["ADMIN", "AGENT", "SUPERVISOR", "AGENT_TEST"], {
    message: "Veuillez sélectionner un rôle",
  }),
  iconColor: z.string(),
  roleColor: z.string(),
  paymentRemainingDays: z.coerce.number().int().min(0),
  paymentDefaultDays: z.coerce.number().int().min(0),

  // Permissions
  canViewOrders: z.boolean().optional(),
  canEditOrders: z.boolean().optional(),
  canViewUsers: z.boolean().optional(),
  canEditUsers: z.boolean().optional(),
  canViewProducts: z.boolean().optional(),
  canEditProducts: z.boolean().optional(),
  canViewStatuses: z.boolean().optional(),
  canEditStatuses: z.boolean().optional(),
  canViewReporting: z.boolean().optional(),
  canViewDashboard: z.boolean().optional(),
});





export type UserFormData = z.infer<typeof userFormSchema>;

// Schéma pour la création (mot de passe requis)
export const createUserSchema = userFormSchema.extend({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type CreateUserData = z.infer<typeof createUserSchema>;

// Schéma pour la modification (mot de passe optionnel)
export const updateUserSchema = userFormSchema.extend({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional().or(z.literal("")),
});

export type UpdateUserData = z.infer<typeof updateUserSchema>;


export enum Etat {
  STATUS_01 = "STATUS_01",
  STATUS_02 = "STATUS_02",
  STATUS_03 = "STATUS_03",
  STATUS_04 = "STATUS_04",
  STATUS_05 = "STATUS_05",
  STATUS_06 = "STATUS_06",
  STATUS_07 = "STATUS_07",
  STATUS_08 = "STATUS_08",
  STATUS_09 = "STATUS_09",
  STATUS_10 = "STATUS_10",
  STATUS_11 = "STATUS_11",
  STATUS_12 = "STATUS_12",
  STATUS_13 = "STATUS_13",
  STATUS_14 = "STATUS_14",
  STATUS_15 = "STATUS_15",
}

export const statusFormSchema = z.object({
  name: z.string().min(1, "Nom obligatoire"),
  recallAfterH: z
    .number()
    .int()
    .min(1)
    .optional(),
  color: z.string(),
  etat: z.nativeEnum(Etat),
  isActive: z.boolean(),
});


export type StatusFormData = z.infer<typeof statusFormSchema>;
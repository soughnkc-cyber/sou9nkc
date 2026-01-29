import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSmartDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const timeStr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (diffDays === 0) {
    return `Aujourd'hui à ${timeStr}`;
  } else if (diffDays === 1) {
    return `Demain à ${timeStr}`;
  } else if (diffDays > 1) {
    return `Dans ${diffDays} jours`; // Simplified as requested "calcul le temps restant"
  } else if (diffDays === -1) {
    return `Hier à ${timeStr}`;
  } else {
    // Past or far future specific date if needed, but for recall usually future. 
    // If it's past > 1 day, standard date.
    return `${d.toLocaleDateString("fr-FR")} à ${timeStr}`;
  }
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSmartDate(
  date: Date | string | null | undefined, 
  t?: (key: string, values?: any) => string
): string {
  if (!date) return "-";
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Force fr-FR to ensure Western digits
  const timeStr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = d.toLocaleDateString("fr-FR");

  if (t) {
    if (diffDays === 0) {
      return t('today', { time: timeStr });
    } else if (diffDays === 1) {
      return t('tomorrow', { time: timeStr });
    } else if (diffDays > 1) {
      return t('inDays', { days: diffDays });
    } else if (diffDays === -1) {
      return t('yesterday', { time: timeStr });
    } else {
      return t('onDate', { date: dateStr, time: timeStr });
    }
  }

  // Fallback for non-translated usage (maintaining backward compatibility/internal logs)
  if (diffDays === 0) return `Aujourd'hui à ${timeStr}`;
  if (diffDays === 1) return `Demain à ${timeStr}`;
  if (diffDays > 1) return `Dans ${diffDays} jours`;
  if (diffDays === -1) return `Hier à ${timeStr}`;
  
  return `${dateStr} à ${timeStr}`;
}

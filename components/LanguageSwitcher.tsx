'use client';

import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/routing';
import {useTransition} from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const tl = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(value: string) {
    startTransition(() => {
      router.replace(pathname, {locale: value});
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Languages className="w-4 h-4 text-muted-foreground" />
      <Select
        defaultValue={locale}
        onValueChange={onSelectChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[120px] h-8 text-xs bg-transparent border-none shadow-none focus:ring-0">
          <SelectValue placeholder={tl('language')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fr">Français</SelectItem>
          <SelectItem value="ar">العربية</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

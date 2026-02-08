"use client";

import * as React from "react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from "date-fns";
import { fr, ar } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useTranslations, useLocale } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: {
  className?: string;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}) {
  const t = useTranslations("DateFilter");
  const locale = useLocale();
  const dateLocale = locale === 'ar' ? ar : fr;

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            size="sm"
            className={cn(
              "h-8 rounded-lg border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center shrink-0 font-bold text-xs",
              "w-8 md:w-auto md:px-3 md:justify-start", // Responsive width
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4 text-[#1F30AD] md:mr-2" />
            <span className="hidden md:inline truncate">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd MMM", { locale: dateLocale })} -{" "}
                    {format(date.to, "dd MMM", { locale: dateLocale })}
                  </>
                ) : (
                  format(date.from, "dd MMM", { locale: dateLocale })
                )
              ) : (
                <span>{t('filterByDate')}</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl border-gray-100 shadow-xl overflow-hidden" align="end">
          <div className="flex flex-col md:flex-row">
            <div className="p-3 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 flex flex-col gap-1.5 md:min-w-[160px]">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1">{t('shortcuts')}</p>
               <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
                 <Button variant="ghost" size="sm" className="justify-start font-bold text-xs h-8 rounded-lg" onClick={() => setDate({ from: new Date(), to: new Date() })}>
                   {t('today')}
                 </Button>
                 <Button variant="ghost" size="sm" className="justify-start font-bold text-xs h-8 rounded-lg" onClick={() => setDate({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) })}>
                   {t('yesterday')}
                 </Button>
                 <Button variant="ghost" size="sm" className="justify-start font-bold text-xs h-8 rounded-lg" onClick={() => setDate({ from: subDays(new Date(), 7), to: new Date() })}>
                   {t('last7days')}
                 </Button>
                 <Button variant="ghost" size="sm" className="justify-start font-bold text-xs h-8 rounded-lg" onClick={() => setDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>
                   {t('thisMonth')}
                 </Button>
                 <Button variant="ghost" size="sm" className="justify-start font-bold text-xs h-8 rounded-lg" onClick={() => setDate({ from: startOfYear(new Date()), to: endOfYear(new Date()) })}>
                   {t('thisYear')}
                 </Button>
               </div>
               <Button variant="ghost" size="sm" className="justify-start font-bold text-xs h-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDate(undefined)}>
                 {t('clearFilter')}
               </Button>
            </div>
            <div className="p-1">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
                locale={dateLocale}
                className="p-3"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

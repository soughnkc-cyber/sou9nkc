"use client";

import * as React from "react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";

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
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-bold h-10 rounded-xl border-gray-200 hover:bg-gray-50 transition-colors px-4",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-orange-600" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd LLL", { locale: fr })} -{" "}
                  {format(date.to, "dd LLL", { locale: fr })}
                </>
              ) : (
                format(date.from, "dd LLL yyyy", { locale: fr })
              )
            ) : (
              <span>Filtrer par date</span>
            )}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl border-gray-100 shadow-xl" align="end">
          <div className="flex flex-col sm:flex-row">
            <div className="p-3 border-r border-gray-100 bg-gray-50/50 flex flex-col gap-2 min-w-[160px]">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1">Raccourcis</p>
               <Button variant="ghost" size="sm" className="justify-start font-bold text-xs h-8 rounded-lg" onClick={() => setDate({ from: new Date(), to: new Date() })}>
                 Aujourd'hui
               </Button>
               <Button variant="ghost" size="sm" className="justify-start font-bold text-xs h-8 rounded-lg" onClick={() => setDate({ from: subDays(new Date(), 7), to: new Date() })}>
                 7 derniers jours
               </Button>
               <Button variant="ghost" size="sm" className="justify-start font-bold text-xs h-8 rounded-lg" onClick={() => setDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>
                 Ce mois-ci
               </Button>
               <Button variant="ghost" size="sm" className="justify-start font-bold text-xs h-8 rounded-lg" onClick={() => setDate({ from: startOfYear(new Date()), to: endOfYear(new Date()) })}>
                 Cette année
               </Button>
               <Button variant="ghost" size="sm" className="justify-start font-bold text-xs h-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDate(undefined)}>
                 Effacer
               </Button>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={1}
              locale={fr}
              className="p-3"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

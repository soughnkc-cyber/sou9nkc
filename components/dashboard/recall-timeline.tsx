"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClockIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr, arSA } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";

interface RecallTimelineData {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  recallAt: string;
  statusName: string;
  statusColor: string;
  agentName: string;
}

interface RecallTimelineProps {
  data: RecallTimelineData[];
}

export function RecallTimeline({ data }: RecallTimelineProps) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();

  const formatRecallDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale === 'ar' ? "ar-EG" : "fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const dateLocale = locale === 'ar' ? arSA : fr;
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true,
        locale: dateLocale
      });
    } catch {
      return "";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <PhoneIcon className="h-5 w-5 text-blue-600" />
            {t('nextRecallTitle')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('recallsScheduled', { count: data.length })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {data.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t('noRecallScheduled')}
            </div>
          ) : (
            data.map((recall, index) => (
              <Link 
                key={recall.id} 
                href={`/list/orders?search=${recall.orderNumber}`}
                className="block"
              >
                <div className="relative flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
                  {/* Timeline connector */}
                  {index !== data.length - 1 && (
                    <div className="absolute left-6 top-14 w-0.5 h-full bg-gray-200" />
                  )}
                  
                  {/* Timeline dot */}
                  <div className="shrink-0 mt-1">
                    <div className="h-4 w-4 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-sm group-hover:text-blue-700">
                          #{recall.orderNumber} - {recall.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('agent')}: {recall.agentName}
                        </p>
                      </div>
                      <Badge 
                        style={{ 
                          backgroundColor: `${recall.statusColor}20`,
                          color: recall.statusColor,
                          borderColor: recall.statusColor
                        }}
                        variant="outline"
                        className="shrink-0"
                      >
                        {recall.statusName}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ClockIcon className="h-3 w-3" />
                      <span className="font-medium">{formatRecallDate(recall.recallAt)}</span>
                      <span className="text-blue-600">({getRelativeTime(recall.recallAt)})</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

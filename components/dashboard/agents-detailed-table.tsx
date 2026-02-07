"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

interface AgentDetailedData {
  id: string;
  name: string;
  role: string;
  totalAssigned: number;
  processed: number;
  processingRate: number;
  avgProcessingTime: number;
  toRecall: number;
}

interface AgentsDetailedTableProps {
  data: AgentDetailedData[];
}

export function AgentsDetailedTable({ data }: AgentsDetailedTableProps) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();

  const getRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600 bg-green-50";
    if (rate >= 60) return "text-blue-600 bg-blue-50";
    if (rate >= 40) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    if (role === "SUPERVISOR") return "default";
    if (role === "AGENT") return "secondary";
    return "outline";
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-blue-600" />
            {t('detailedStatsTitle')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('detailedStatsDesc')}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">{t('colAgent')}</TableHead>
                <TableHead className="font-bold">{t('colRole')}</TableHead>
                <TableHead className="text-right font-bold">{t('colAssigned')}</TableHead>
                <TableHead className="text-right font-bold">{t('colProcessed')}</TableHead>
                <TableHead className="text-right font-bold">{t('colRate')}</TableHead>
                <TableHead className="text-right font-bold">{t('colAvgTime')}</TableHead>
                <TableHead className="text-right font-bold">{t('colToRecall')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t('noActiveAgent')}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((agent) => (
                  <TableRow key={agent.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(agent.role)}>
                        {agent.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{agent.totalAssigned.toLocaleString(locale === 'ar' ? "ar-EG" : "fr-FR")}</TableCell>
                    <TableCell className="text-right">{agent.processed.toLocaleString(locale === 'ar' ? "ar-EG" : "fr-FR")}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("px-2 py-1 rounded-md font-semibold text-sm", getRateColor(agent.processingRate))}>
                        {agent.processingRate.toLocaleString(locale === 'ar' ? "ar-EG" : "fr-FR")}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {agent.avgProcessingTime > 0 ? `${agent.avgProcessingTime.toLocaleString(locale === 'ar' ? "ar-EG" : "fr-FR")} min` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {agent.toRecall > 0 ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {agent.toRecall.toLocaleString(locale === 'ar' ? "ar-EG" : "fr-FR")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

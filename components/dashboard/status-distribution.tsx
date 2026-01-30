"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChartIcon } from "lucide-react";

interface StatusStat {
  name: string;
  count: number;
}

interface StatusDistributionProps {
  stats: StatusStat[];
}

export function StatusDistribution({ stats }: StatusDistributionProps) {
  const total = stats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="col-span-full lg:col-span-3 border-slate-100 shadow-xs rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100">
        <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
          <PieChartIcon className="mr-2 h-4 w-4 text-orange-600" />
          Répartition des Statuts
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {stats.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground italic text-sm">
              Aucune donnée de statut.
            </p>
          ) : (
            stats.map((stat, index) => (
              <div key={stat.name} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-tight">{stat.name}</span>
                  <span className="font-black text-orange-600">{stat.count}</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 bg-linear-to-r from-orange-500 to-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                    style={{
                      width: total > 0 ? `${(stat.count / total) * 100}%` : "0%",
                      transitionDelay: `${index * 100}ms`
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
        {total > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest">
              <span>Total Commandes</span>
              <span className="text-slate-900 font-black">{total}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

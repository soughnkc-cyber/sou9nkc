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
    <Card className="col-span-full lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center text-blue-900">
          <PieChartIcon className="mr-2 h-5 w-5 text-blue-600" />
          Répartition des Statuts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stats.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground italic text-sm">
              Aucune donnée de statut.
            </p>
          ) : (
            stats.map((stat, index) => (
              <div key={stat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700">{stat.name}</span>
                  <span className="font-black text-blue-600">{stat.count}</span>
                </div>
                <div className="relative h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
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
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Total Commandes</span>
              <span className="text-gray-900 font-black">{total}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

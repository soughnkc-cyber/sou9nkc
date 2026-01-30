"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrophyIcon } from "lucide-react";
import { Crown, Medal } from "lucide-react";

interface AgentPerformance {
  name: string;
  ordersProcessed: number;
  avgProcessingTime: number;
}

interface TopAgentsLeaderboardProps {
  data: AgentPerformance[];
}

const getMedalIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return null;
};

const getRankColor = (rank: number) => {
  if (rank === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
  if (rank === 2) return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
  if (rank === 3) return "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200";
  return "bg-white border-gray-100";
};

export function TopAgentsLeaderboard({ data }: TopAgentsLeaderboardProps) {
  // Sort by orders processed and take top 5
  const topAgents = [...data]
    .sort((a, b) => b.ordersProcessed - a.ordersProcessed)
    .slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center text-blue-900">
          <TrophyIcon className="mr-2 h-5 w-5 text-blue-600" />
          Top Agents - Plus de Commandes Traitées
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topAgents.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground italic text-sm">
            Aucune donnée disponible.
          </p>
        ) : (
          <div className="space-y-3">
            {topAgents.map((agent, index) => {
              const rank = index + 1;
              return (
                <div
                  key={agent.name}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${getRankColor(rank)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getMedalIcon(rank) || (
                        <div className="text-lg font-bold text-gray-400">#{rank}</div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Temps moy: {agent.avgProcessingTime} min
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-blue-600">
                      {agent.ordersProcessed}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Commandes
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

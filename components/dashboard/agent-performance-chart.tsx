"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ClockIcon } from "lucide-react";

interface AgentPerformance {
  name: string;
  ordersProcessed: number;
  avgProcessingTime: number;
}

interface AgentPerformanceChartProps {
  data: AgentPerformance[];
}

// Color gradient from green (fast) to red (slow)
const getColorForTime = (time: number, maxTime: number) => {
  const ratio = time / maxTime;
  if (ratio < 0.33) return "#10b981"; // green
  if (ratio < 0.66) return "#f59e0b"; // amber
  return "#ef4444"; // red
};

export function AgentPerformanceChart({ data }: AgentPerformanceChartProps) {
  const maxTime = Math.max(...data.map(d => d.avgProcessingTime), 1);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center text-blue-900">
          <ClockIcon className="mr-2 h-5 w-5 text-blue-600" />
          Temps Moyen de Traitement par Agent
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground italic text-sm">
            Aucune donnée de performance disponible.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number"
                label={{ value: 'Minutes', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={90}
              />
              <Tooltip
                formatter={(value: any) => [`${value} min`, "Temps moyen"]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
              <Bar 
                dataKey="avgProcessingTime"
                radius={[0, 8, 8, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorForTime(entry.avgProcessingTime, maxTime)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

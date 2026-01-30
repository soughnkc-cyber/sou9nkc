"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { PieChartIcon } from "lucide-react";

interface StatusStat {
  name: string;
  count: number;
  color?: string;
}

interface StatusDistributionPieProps {
  stats: StatusStat[];
}

// Default colors if not provided
const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export function StatusDistributionPie({ stats }: StatusDistributionPieProps) {
  const total = stats.reduce((acc, curr) => acc + curr.count, 0);

  // Prepare data for pie chart
  const data = stats.map((stat, index) => ({
    name: stat.name,
    value: stat.count,
    color: stat.color || COLORS[index % COLORS.length],
    percentage: total > 0 ? ((stat.count / total) * 100).toFixed(1) : "0",
  }));

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="font-semibold text-xs"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="col-span-full lg:col-span-1 h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center text-blue-900">
          <PieChartIcon className="mr-2 h-5 w-5 text-blue-600" />
          Répartition des Statuts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 || total === 0 ? (
          <p className="text-center py-12 text-muted-foreground italic text-sm">
            Aucune donnée de statut disponible.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`${value} commandes`, ""]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                formatter={(value, entry: any) => {
                  const item = data.find(d => d.name === value);
                  return `${value} (${item?.percentage}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

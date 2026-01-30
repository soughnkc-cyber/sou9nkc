"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface OrderEvolutionData {
  date: string;
  total: number;
  processed: number;
  pending: number;
}

interface OrdersTrendChartProps {
  data: OrderEvolutionData[];
}

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  processed: {
    label: "Traitées",
    color: "hsl(var(--chart-2))",
  },
  pending: {
    label: "En attente",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function OrdersTrendChart({ data }: OrdersTrendChartProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const chartData = data.map((item) => ({
    ...item,
    dateFormatted: formatDate(item.date),
  }));

  return (
    <Card className="col-span-full border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Efficacité des Commandes</CardTitle>
            <CardDescription className="font-medium text-slate-500">
              Analyse comparative du flux quotidien des commandes
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-(--color-total) shadow-xs" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-(--color-processed) shadow-xs" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Traitées</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 20,
              top: 10,
              bottom: 0
            }}
          >
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="fillProcessed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-processed)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--color-processed)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis
              dataKey="dateFormatted"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={32}
              tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
            />
            <ChartTooltip
              cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="total"
              type="monotone"
              stroke="var(--color-total)"
              strokeWidth={4}
              fill="url(#fillTotal)"
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-total)" }}
            />
            <Area
              dataKey="processed"
              type="monotone"
              stroke="var(--color-processed)"
              strokeWidth={4}
              fill="url(#fillProcessed)"
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-processed)" }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="bg-slate-50/30 border-t border-slate-50 py-4">
        <div className="flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-bold text-emerald-600 transition-transform hover:translate-x-1 cursor-default">
              Performance positive ce mois <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-slate-400 font-medium italic">
              Données actualisées en temps réel
            </div>
        </div>
      </CardFooter>
    </Card>
  )
}

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
import { useTranslations, useLocale } from "next-intl"

interface OrderEvolutionData {
  date: string;
  total: number;
  processed: number;
  pending: number;
}

interface OrdersTrendChartProps {
  data: OrderEvolutionData[];
}

export function OrdersTrendChart({ data }: OrdersTrendChartProps) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();

  const chartConfig = {
    total: {
      label: t('total'),
      color: "hsl(var(--chart-1))",
    },
    processed: {
      label: t('processedPlot'),
      color: "hsl(var(--chart-2))",
    },
    pending: {
      label: t('pendingPlot'),
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale === 'ar' ? "ar-EG" : "fr-FR", {
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
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">{t('ordersTrendTitle')}</CardTitle>
            <CardDescription className="font-medium text-slate-500">
              {t('ordersTrendDesc')}
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-(--color-total) shadow-xs" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{t('total')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-(--color-processed) shadow-xs" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{t('processedPlot')}</span>
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
              {t('performancePositive')} <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-slate-400 font-medium italic">
              {t('realTimeData')}
            </div>
        </div>
      </CardFooter>
    </Card>
  )
}

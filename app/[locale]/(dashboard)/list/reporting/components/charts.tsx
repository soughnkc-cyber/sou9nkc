"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart, 
  Bar, 
  Cell,
  Legend,
  PieChart,
  Pie
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr, arSA } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

const CHART_COLORS = [
  "#1F30AD", // brand blue
  "#3b82f6", // blue-500
  "#60a5fa", // blue-400
  "#1e40af", // blue-800
  "#172585", // brand darker
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
];

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ChartCard = ({ title, children, className }: ChartCardProps) => (
  <Card className={cn("transition-all duration-300 hover:shadow-md hover:border-blue-100", className)}>
    <CardHeader className="pb-2 bg-gray-50/50 border-b border-gray-100 mb-4">
      <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[300px] w-full mt-4">
        {children}
      </div>
    </CardContent>
  </Card>
);

export const RevenueAreaChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();
  const dateLocale = locale === 'ar' ? arSA : fr;

  return (
    <ChartCard title={t('charts.salesEvolution')} className="lg:col-span-4 border-gray-100 shadow-xs rounded-2xl">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1F30AD" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#1F30AD" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => format(parseISO(str), "dd MMM", { locale: dateLocale })}
            style={{ fontSize: '10px', fontWeight: 'bold' }}
            tick={{ fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            style={{ fontSize: '10px', fontWeight: 'bold' }}
            tick={{ fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')}`}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '12px'
            }}
            labelFormatter={(label) => format(parseISO(label), "PPPP", { locale: dateLocale })}
            formatter={(value: any) => [`${value.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')} MRU`, t('charts.revenueLabel')]}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#1F30AD" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
            name={t('charts.revenue')}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const OrdersBarChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();
  const dateLocale = locale === 'ar' ? arSA : fr;

  return (
    <ChartCard title={t('charts.ordersVolume')} className="lg:col-span-3 border-gray-100 shadow-xs rounded-2xl">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => format(parseISO(str), "dd MMM", { locale: dateLocale })}
            style={{ fontSize: '10px', fontWeight: 'bold' }}
            tick={{ fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            style={{ fontSize: '10px', fontWeight: 'bold' }}
            tick={{ fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelFormatter={(label) => format(parseISO(label), "PPPP", { locale: dateLocale })}
            formatter={(value: any) => [value.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR'), t('charts.orders')]}
          />
          <Bar dataKey="orders" fill="#1F30AD" radius={[4, 4, 0, 0]} name={t('charts.orders')} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const TopProductsChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();

  return (
    <ChartCard title={t('charts.topProductsRevenue')} className="lg:col-span-4 border-gray-100 shadow-xs rounded-2xl">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120} 
            style={{ fontSize: '10px', fontWeight: 'bold' }}
            tick={{ fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            formatter={(value: any) => `${value.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')} MRU`}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} name={t('charts.revenueLabel')}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const StatusPieChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();

  return (
    <ChartCard title={t('charts.statusDistribution')} className="lg:col-span-3 border-gray-100 shadow-xs rounded-2xl">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="count"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => value.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')}
          />
          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

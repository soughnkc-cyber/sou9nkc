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
  Pie,
  LineChart,
  Line
} from "recharts";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { fr, arSA } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

const CHART_COLORS = [
  "#22c55e", // green (Confirmed)
  "#3b82f6", // blue (Pending)
  "#f97316", // orange (No answer)
  "#fbbf24", // amber (Canceled)
  "#64748b", // slate (Duplicate)
  "#ef4444", // red (Wrong)
  "#a855f7", // purple (Expired)
];

const formatNumber = (value: number, locale: string, options?: Intl.NumberFormatOptions) => {
  return value.toLocaleString(locale === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', options);
};

const formatDate = (dateStr: string, locale: string, options?: Intl.DateTimeFormatOptions) => {
  try {
    const date = parseISO(dateStr);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', options);
  } catch {
    return dateStr;
  }
};

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

const ChartCard = ({ title, children, className, compact }: ChartCardProps) => (
  <Card className={cn("transition-all duration-300 hover:shadow-md hover:border-blue-100 overflow-hidden", className)}>
    <CardHeader className={cn("pb-2 bg-gray-50/50 border-b border-gray-100", compact ? "px-3 py-2" : "px-4 py-3 sm:px-6 sm:py-4")}>
      <CardTitle className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</CardTitle>
    </CardHeader>
    <CardContent className={cn("p-0 sm:p-6", compact ? "" : "p-3")}>
      <div className={cn("w-full", compact ? "h-[180px] sm:h-[220px]" : "h-[250px] sm:h-[300px] mt-2 sm:mt-4")} dir="ltr">
        {children}
      </div>
    </CardContent>
  </Card>
);

export const RevenueAreaChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();

  return (
    <ChartCard title={t('charts.salesEvolution')} className="lg:col-span-4 border-gray-100 shadow-xs rounded-2xl">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1F30AD" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#1F30AD" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => formatDate(str, locale, { day: '2-digit', month: 'short' })}
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
            tickFormatter={(value) => formatNumber(value, locale, { notation: 'compact' })}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '12px'
            }}
            labelFormatter={(label) => formatDate(label, locale, { dateStyle: 'full' })}
            formatter={(value: any) => [`${formatNumber(value, locale)} MRU`, t('charts.confirmedRevenue')]}
          />
          <Area 
            type="monotone" 
            dataKey="confirmedRevenue" 
            stroke="#10B981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorConfirmed)" 
            name={t('charts.confirmedRevenue')}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const AgentDetailModal = ({ 
  isOpen, 
  onClose, 
  agent 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  agent: any 
}) => {
  const t = useTranslations("Reporting");
  const d = useTranslations("Dashboard");
  const locale = useLocale();

  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] md:w-full h-fit max-h-[95vh] flex flex-col p-4 md:p-6 overflow-hidden">
        <DialogHeader className="shrink-0 mb-2 md:mb-4">
          <DialogTitle className="text-lg md:text-xl font-bold flex flex-wrap items-center gap-2">
            <span>{t('charts.agentDetail')}: {agent.name}</span>
            <Badge variant="outline" className="text-[10px] md:text-xs">{agent.role}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Summary KPIs - Simple & Colored */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
            <p className="text-[9px] text-blue-600 font-bold uppercase mb-1">{t('charts.orders')}</p>
            <p className="text-xl font-bold text-blue-900">{formatNumber(agent.totalAssigned, locale)}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 shadow-sm">
            <p className="text-[9px] text-indigo-600 font-bold uppercase mb-1">{d('processed')}</p>
            <p className="text-xl font-bold text-indigo-900">{formatNumber(agent.processed, locale)}</p>
          </div>
          <div className="p-3 bg-sky-50 rounded-lg border border-sky-100 shadow-sm">
            <p className="text-[9px] text-sky-600 font-bold uppercase mb-1">{d('processingRate')}</p>
            <p className="text-xl font-bold text-sky-900">{agent.processingRate}%</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm">
            <p className="text-[9px] text-emerald-600 font-bold uppercase mb-1">{d('revenue')}</p>
            <p className="text-xl font-bold text-emerald-900">{agent.confirmationRate}%</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 shadow-sm">
            <p className="text-[9px] text-orange-600 font-bold uppercase mb-1">{d('toRecall')}</p>
            <p className="text-xl font-bold text-orange-900">{formatNumber(agent.toRecall, locale)}</p>
          </div>
        </div>

        {/* Scrollable Table Section */}
        <div className="mt-6 md:mt-8 flex flex-col min-h-0 overflow-hidden">
          <h3 className="text-xs font-bold mb-3 text-slate-500 uppercase flex items-center gap-2">
             <div className="w-1 h-3 bg-blue-600 rounded-full" />
             {t('charts.dailyBreakdown')}
          </h3>
          <div className="rounded-xl border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto overflow-y-auto max-h-[50vh]">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-bold text-xs">{d('periodAnalyzed')}</TableHead>
                  <TableHead className="text-center font-bold text-xs">{d('totalOrders')}</TableHead>
                  <TableHead className="text-center font-bold text-xs">{d('processed')}</TableHead>
                  <TableHead className="text-center font-bold text-xs">{d('orderStatuses.Confirmé')}</TableHead>
                  <TableHead className="text-center font-bold text-xs">{d('firstOrder')}</TableHead>
                  <TableHead className="text-center font-bold text-xs">{d('lastOrder')}</TableHead>
                  <TableHead className="text-center font-bold text-xs">{d('workDuration')}</TableHead>
                  <TableHead className="text-right font-bold text-xs pr-6">{t('charts.rate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agent.dailyBreakdown?.map((day: any) => (
                  <TableRow key={day.date} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-700 py-3 text-sm">
                      {formatDate(day.date, locale, { dateStyle: 'medium' })}
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-900 text-sm">
                      {formatNumber(day.totalAssigned, locale)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-600 text-sm">
                      {formatNumber(day.processed, locale)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-green-600 text-sm">
                      {formatNumber(day.confirmed, locale)}
                    </TableCell>
                    <TableCell className="text-center text-purple-600 text-xs font-medium">
                      {day.firstOrderTime ? new Date(day.firstOrderTime).toLocaleTimeString(locale === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </TableCell>
                    <TableCell className="text-center text-pink-600 text-xs font-medium">
                      {day.lastOrderTime ? new Date(day.lastOrderTime).toLocaleTimeString(locale === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </TableCell>
                    <TableCell className="text-center text-violet-600 text-xs font-medium">
                      {day.workDurationMinutes > 0 ? `${Math.floor(day.workDurationMinutes / 60)}h ${day.workDurationMinutes % 60}min` : '-'}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge className={cn(
                        "font-bold text-[10px] px-2 py-0",
                        day.rate >= 70 ? "bg-green-100 text-green-700 hover:bg-green-100" :
                        day.rate >= 40 ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                        "bg-red-100 text-red-700 hover:bg-red-100"
                      )} variant="secondary">
                        {day.rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ProductDetailModal = ({ 
  isOpen, 
  onClose, 
  product 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  product: any 
}) => {
  const t = useTranslations("Reporting");
  const d = useTranslations("Dashboard");
  const locale = useLocale();

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] md:w-full h-fit max-h-[95vh] flex flex-col p-4 md:p-6 overflow-hidden">
        <DialogHeader className="shrink-0 mb-2 md:mb-4">
          <DialogTitle className="text-lg md:text-xl font-bold">
            {t('charts.productDetail')}: {product.name}
          </DialogTitle>
        </DialogHeader>

        {/* Summary KPIs - Simple & Colored */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
            <p className="text-[9px] text-blue-600 font-bold uppercase mb-1">{t('charts.orders')}</p>
            <p className="text-xl font-bold text-blue-900">{formatNumber(product.totalOrders, locale)}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm">
            <p className="text-[9px] text-emerald-600 font-bold uppercase mb-1">{d('orderStatuses.Confirmé')}</p>
            <p className="text-xl font-bold text-emerald-900">{formatNumber(product.count, locale)}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 shadow-sm">
            <p className="text-[9px] text-amber-600 font-bold uppercase mb-1">{t('charts.revenueLabel')}</p>
            <p className="text-xl font-bold text-amber-900">{formatNumber(product.revenue, locale)} MRU</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 shadow-sm">
            <p className="text-[9px] text-indigo-600 font-bold uppercase mb-1">{t('charts.conversionRate')}</p>
            <p className="text-xl font-bold text-indigo-900">{product.conversionRate}%</p>
          </div>
        </div>

        {/* Scrollable Table Section */}
        <div className="mt-6 md:mt-8 flex flex-col min-h-0 overflow-hidden">
          <h3 className="text-xs font-bold mb-3 text-slate-500 uppercase flex items-center gap-2">
             <div className="w-1 h-3 bg-indigo-600 rounded-full" />
             {t('charts.dailyBreakdown')}
          </h3>
          <div className="rounded-xl border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto overflow-y-auto max-h-[50vh]">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-bold text-xs">{d('periodAnalyzed')}</TableHead>
                  <TableHead className="text-center font-bold text-xs">{d('totalOrders')}</TableHead>
                  <TableHead className="text-center font-bold text-xs">{d('orderStatuses.Confirmé')}</TableHead>
                  <TableHead className="text-right font-bold text-xs pr-6">{t('charts.rate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.dailyBreakdown?.map((day: any) => (
                  <TableRow key={day.date} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-700 py-3 text-sm">
                      {formatDate(day.date, locale, { dateStyle: 'medium' })}
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-900 text-sm">
                      {formatNumber(day.orders, locale)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-green-600 text-sm">
                      {formatNumber(day.confirmed, locale)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge className={cn(
                        "font-bold text-[10px] px-2 py-0",
                        day.rate >= 50 ? "bg-green-100 text-green-700 hover:bg-green-100" :
                        day.rate >= 30 ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                        "bg-red-100 text-red-700 hover:bg-red-100"
                      )} variant="secondary">
                        {day.rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const OrdersBarChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  return (
    <>
      <ChartCard title={t('charts.ordersVolume')} className="lg:col-span-3 border-gray-100 shadow-xs rounded-2xl">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                setSelectedAgent(state.activePayload[0].payload);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
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
              tickFormatter={(value) => formatNumber(value, locale, { notation: 'compact' })}
            />
            <Tooltip 
              cursor={{ fill: '#f1f5f9', radius: 4 }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#111827' }}
              formatter={(value: any) => [formatNumber(value, locale), t('charts.orders')]}
            />
            <Bar 
              dataKey="totalAssigned" 
              fill="#1F30AD" 
              radius={[4, 4, 0, 0]} 
              name={t('charts.orders')} 
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <AgentDetailModal 
        isOpen={!!selectedAgent} 
        onClose={() => setSelectedAgent(null)} 
        agent={selectedAgent} 
      />
    </>
  );
};

export const TopProductsChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  return (
    <>
      <ChartCard title={t('charts.topProductsRevenue')} className="lg:col-span-4 border-gray-100 shadow-xs rounded-2xl">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={(data) => {
              if (data && data.activePayload && data.activePayload.length > 0) {
                setSelectedProduct(data.activePayload[0].payload);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={140} 
              style={{ fontSize: '10px', fontWeight: 'bold' }}
              tick={{ fill: '#475569' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              formatter={(value: any) => `${formatNumber(value, locale)} MRU`}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar 
              dataKey="revenue" 
              fill="#10b981" 
              radius={[0, 4, 4, 0]} 
              name={t('charts.revenueLabel')}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ProductDetailModal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct} 
      />
    </>
  );
};

export const StatusPieChart = ({ data, hideCard = false }: { data: any[], hideCard?: boolean }) => {
  const t = useTranslations("Reporting");
  const d = useTranslations("Dashboard");
  const locale = useLocale();

  const formattedData = data.map(item => {
    const statusKey = item.name;
    let translatedName = item.name;
    try {
      translatedName = d(`orderStatuses.${statusKey}`);
    } catch (e) {
      // Fallback
    }
    
    return {
      ...item,
      name: translatedName
    };
  });

  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={formattedData}
          cx="45%"
          cy="50%"
          outerRadius={80}
          dataKey="count"
          nameKey="name"
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
            if (percent < 0.05) return null; // Don't show labels for tiny slices
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);

            return (
              <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor="middle" 
                dominantBaseline="central" 
                style={{ fontSize: '12px', fontWeight: '900' }}
              >
                {`${(percent * 100).toFixed(0)}%`}
              </text>
            );
          }}
          labelLine={false}
        >
          {formattedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          formatter={(value: any) => formatNumber(value, locale)}
        />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right"
          formatter={(value, entry: any) => {
            const item = formattedData.find(d => d.name === value);
            return (
              <span className="text-slate-700 whitespace-nowrap">
                {value} <span className="text-slate-400 font-normal">({formatNumber(item?.revenue || 0, locale)} MRU)</span>
              </span>
            );
          }}
          wrapperStyle={{ 
            fontSize: '10px', 
            fontWeight: 'bold',
            paddingLeft: '0px'
          }} 
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );


  if (hideCard) return chart;

  return (
    <ChartCard 
      title={t('charts.statusDistribution')} 
      className="border-gray-100 shadow-xs rounded-2xl h-full"
      compact
    >
      {chart}
    </ChartCard>
  );
};

export const ProcessingTimeChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();

  return (
    <ChartCard title={t('charts.processingTimeTitle')}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => formatDate(value, locale, { day: '2-digit', month: '2-digit' })}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 10 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '4 4' }}
            formatter={(value: any) => [formatNumber(value, locale), t('charts.avgTime')]}
          />
          <Line 
            type="monotone" 
            dataKey="avgTime" 
            name={t('charts.avgTime')} 
            stroke="#F59E0B" 
            strokeWidth={3} 
            dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const WeekdayChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();

  const getDayName = (dayIndex: number) => {
    const date = new Date(2024, 0, 7 + dayIndex); // 2024-01-07 is Sunday
    return date.toLocaleDateString(locale === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { weekday: 'short' });
  };

  const formattedData = data.map(d => ({
    ...d,
    dayName: getDayName(d.day)
  }));

  return (
    <ChartCard title={t('charts.ordersByWeekday')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="dayName" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 10 }}
            dy={10}
            interval={0}
          />
          <YAxis hide />
          <Tooltip 
            cursor={{ fill: '#F3F4F6' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: any) => [formatNumber(value, locale), t('charts.orders')]}
          />
          <Bar 
            dataKey="orders" 
            name={t('charts.orders')} 
            fill="#8B5CF6" 
            radius={[6, 6, 0, 0]} 
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const AgentPerformanceChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();

  return (
    <ChartCard title={t('charts.agentPerformance')}>
       <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={80}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 10 }}
          />
          <Tooltip 
             cursor={{ fill: '#F3F4F6' }}
             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
             formatter={(value: any) => [`${formatNumber(value, locale)}%`, t('charts.rate')]}
          />
          <Bar 
            dataKey="confirmationRate" 
            name={t('charts.rate')} 
            fill="#10B981" 
            radius={[0, 4, 4, 0]} 
            barSize={15}
            background={{ fill: '#F3F4F6' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const AgentAvgTimeChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();

  return (
    <ChartCard title={t('charts.agentAvgTime')}>
       <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={80}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 10 }}
          />
          <Tooltip 
             cursor={{ fill: '#F3F4F6' }}
             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
             formatter={(value: any) => [`${formatNumber(value, locale)} min`, t('charts.avgTime')]}
          />
          <Bar 
            dataKey="avgProcessingTime" 
            name={t('charts.avgTime')} 
            fill="#3B82F6" 
            radius={[0, 4, 4, 0]} 
            barSize={15}
            background={{ fill: '#F3F4F6' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const ConfirmationRateChart = ({ data }: { data: any[] }) => {
  const t = useTranslations("Reporting");
  const locale = useLocale();

  return (
    <ChartCard title={t('charts.confirmationRateTitle')}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => formatDate(value, locale, { day: '2-digit', month: '2-digit' })}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 10 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 10 }}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: any) => [`${formatNumber(value, locale)}%`, t('charts.performanceRate')]}
          />
          <Area 
            type="monotone" 
            dataKey="rate" 
            name={t('charts.performanceRate')} 
            stroke="#8B5CF6" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorRate)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

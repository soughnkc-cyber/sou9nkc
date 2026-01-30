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
import { fr } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "#f97316", // orange-500
  "#fb923c", // orange-400
  "#fdba74", // orange-300
  "#ea580c", // orange-600
  "#c2410c", // orange-700
  "#f59e0b", // amber-500
  "#d97706", // amber-600
];

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ChartCard = ({ title, children, className }: ChartCardProps) => (
  <Card className={cn("transition-all duration-300 hover:shadow-md hover:border-orange-100", className)}>
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
  return (
    <ChartCard title="Évolution des Ventes (MRU)" className="lg:col-span-4 border-gray-100 shadow-xs rounded-2xl">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => format(parseISO(str), "dd MMM", { locale: fr })}
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
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '12px'
            }}
            labelFormatter={(label) => format(parseISO(label), "PPPP", { locale: fr })}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#f97316" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
            name="Chiffre d'Affaires"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const OrdersBarChart = ({ data }: { data: any[] }) => {
  return (
    <ChartCard title="Volume des Commandes" className="lg:col-span-3 border-gray-100 shadow-xs rounded-2xl">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => format(parseISO(str), "dd MMM", { locale: fr })}
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
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelFormatter={(label) => format(parseISO(label), "PPPP", { locale: fr })}
          />
          <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} name="Commandes" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const TopProductsChart = ({ data }: { data: any[] }) => {
  return (
    <ChartCard title="Top Produits par Revenu" className="lg:col-span-4 border-gray-100 shadow-xs rounded-2xl">
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
            formatter={(value) => `${value.toLocaleString()} MRU`}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} name="Revenu">
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
  return (
    <ChartCard title="Répartition par Statut" className="lg:col-span-3 border-gray-100 shadow-xs rounded-2xl">
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
          />
          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

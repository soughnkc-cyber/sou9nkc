"use server";

import prisma from "@/lib/prisma";

import { Prisma } from "@/app/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasPermission } from "@/lib/auth-utils";
import { checkPermission } from "../auth-helper";





export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  agentIds?: string[];
  statusIds?: string[];
  productIds?: string[];
  searchQuery?: string;
}

export async function getReportStats(filters: ReportFilters) {
  await checkPermission("canViewReporting");
  
  const { startDate, endDate, agentIds, statusIds, productIds, searchQuery } = filters;


  const where: Prisma.OrderWhereInput = {};

  if (startDate || endDate) {
    where.orderDate = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  if (agentIds && agentIds.length > 0) {
    where.agentId = { in: agentIds };
  }

  if (statusIds && statusIds.length > 0) {
    where.statusId = { in: statusIds };
  }

  if (productIds && productIds.length > 0) {
    where.products = {
      some: {
        id: { in: productIds }
      }
    };
  }

  if (searchQuery) {
    where.OR = [
      { customerName: { contains: searchQuery, mode: 'insensitive' } },
      { customerPhone: { contains: searchQuery, mode: 'insensitive' } },
      { orderNumber: isNaN(parseInt(searchQuery)) ? undefined : parseInt(searchQuery) }
    ].filter(v => v !== undefined) as Prisma.OrderWhereInput[];
  }

  // 1. Global Metrics
  const [counts, revenue, avgProcessing] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where,
    }),
    prisma.order.aggregate({
      _avg: { processingTimeMin: true },
      where: { ...where, processingTimeMin: { not: null } },
    }),
  ]);

  // 2. Status Distribution
  const statusStats = await prisma.status.findMany({
    include: {
      _count: {
        select: {
          orders: { where },
        },
      },
    },
  });

  // 3. Agent Performance
  const agents = await prisma.user.findMany({
    where: {
      role: { in: ["AGENT", "AGENT_TEST", "SUPERVISOR", "ADMIN"] },
      ...(agentIds && agentIds.length > 0 && { id: { in: agentIds } }),
    },
    select: {
      id: true,
      name: true,
      orders: {
        where,
        select: {
          id: true,
          totalPrice: true,
          status: {
            select: { name: true },
          },
        },
      },
    },
  });

  const agentPerformance = agents.map(agent => {
    const totalOrders = agent.orders.length;
    const totalRevenue = agent.orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    
    // Calculate confirmed orders (assuming statuses like 'Confirmer', 'Livré', etc. are positive conversions)
    // We'll calculate it based on a common positive naming convention if exact IDs aren't known
    const confirmedOrders = agent.orders.filter(o => 
      o.status?.name?.toLowerCase().includes("confirm") || 
      o.status?.name?.toLowerCase().includes("livré")
    ).length;

    const conversionRate = totalOrders > 0 ? (confirmedOrders / totalOrders) * 100 : 0;

    return {
      agentId: agent.id,
      agentName: agent.name || "Agent sans nom",
      totalOrders,
      confirmedOrders,
      conversionRate: Math.round(conversionRate),
      totalRevenue,
    };
  }).filter(a => a.totalOrders > 0 || (agentIds && agentIds.includes(a.agentId)));

  return {
    totalOrders: counts,
    totalRevenue: revenue._sum.totalPrice || 0,
    averageProcessingTime: Math.round(avgProcessing._avg.processingTimeMin || 0),
    statusDistribution: statusStats.map(s => ({
      name: s.name,
      count: s._count.orders,
    })).filter(s => s.count > 0),
    agentPerformance: agentPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue),
    // 4. Daily Data for Charts
    dailyStats: await getDailyStats(where),
    // 5. Product Performance
    productPerformance: await getProductPerformance(where),
  };
}

async function getDailyStats(where: Prisma.OrderWhereInput) {
  const orders = await prisma.order.findMany({
    where,
    select: {
      orderDate: true,
      totalPrice: true,
    },
    orderBy: { orderDate: 'asc' },
  });

  const dailyMap = new Map<string, { date: string, revenue: number, orders: number }>();

  orders.forEach(order => {
    const dateStr = order.orderDate.toISOString().split('T')[0];
    const current = dailyMap.get(dateStr) || { date: dateStr, revenue: 0, orders: 0 };
    current.revenue += order.totalPrice || 0;
    current.orders += 1;
    dailyMap.set(dateStr, current);
  });

  return Array.from(dailyMap.values());
}

async function getProductPerformance(where: Prisma.OrderWhereInput) {
  const products = await prisma.product.findMany({
    include: {
      orders: {
        where,
        select: { id: true, totalPrice: true }
      }
    }
  });

  return products
    .map(p => ({
      id: p.id,
      name: p.title,
      revenue: p.orders.length > 0 ? p.orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0) : 0,
      count: p.orders.length
    }))
    .filter(p => p.count > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Top 10
}

export async function getFilterOptions() {
  await checkPermission("canViewReporting");
  
  const [agents, statuses, products] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["AGENT", "AGENT_TEST", "SUPERVISOR", "ADMIN"] } },
      select: { id: true, name: true },
    }),
    prisma.status.findMany({
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      select: { id: true, title: true },
    }),
  ]);

  return { 
    agents, 
    statuses, 
    products: products.map(p => ({ id: p.id, name: p.title })) 
  };
}

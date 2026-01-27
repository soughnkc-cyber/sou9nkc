"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  agentIds?: string[];
  statusIds?: string[];
}

export async function getReportStats(filters: ReportFilters) {
  const { startDate, endDate, agentIds, statusIds } = filters;

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
  };
}

export async function getFilterOptions() {
  const [agents, statuses] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["AGENT", "AGENT_TEST", "SUPERVISOR", "ADMIN"] } },
      select: { id: true, name: true },
    }),
    prisma.status.findMany({
      select: { id: true, name: true },
    }),
  ]);

  return { agents, statuses };
}

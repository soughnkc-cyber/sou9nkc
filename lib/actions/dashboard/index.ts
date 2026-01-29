"use server";

import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { checkPermission } from "../auth-helper";

export type DateFilterType = "today" | "week" | "month" | "custom";

interface DateRange {
  start: Date;
  end: Date;
}

export async function getAdminStats(
  filterType: DateFilterType = "month",
  customRange?: { start: string; end: string }
) {
  await checkPermission("canViewDashboard");

  const now = new Date();
  let dateRange: DateRange;

  // Determine date range based on filter
  switch (filterType) {
    case "today":
      dateRange = {
        start: startOfDay(now),
        end: endOfDay(now),
      };
      break;
    case "week":
      dateRange = {
        start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
      break;
    case "month":
      dateRange = {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
      break;
    case "custom":
      if (!customRange) {
        throw new Error("Custom range required for custom filter type");
      }
      dateRange = {
        start: new Date(customRange.start),
        end: new Date(customRange.end),
      };
      break;
  }

  const whereClause = {
    orderDate: {
      gte: dateRange.start,
      lte: dateRange.end,
    },
  };

  // Fetch all orders in the date range with their status
  const ordersInRange = await prisma.order.findMany({
    where: whereClause,
    include: {
      status: {
        select: {
          id: true,
          name: true,
          recallAfterH: true,
          color: true,
        },
      },
    },
  });

  // Calculate the 4 main statistics
  const totalOrders = ordersInRange.length;
  
  // Processed = orders with a status
  const processedOrders = ordersInRange.filter(order => order.statusId !== null).length;
  
  // To Process = orders without a status
  const toProcessOrders = ordersInRange.filter(order => order.statusId === null).length;
  
  // To Recall = orders with recallAt defined
  const toRecallOrders = ordersInRange.filter(
    order => order.recallAt !== null
  ).length;

  // Status distribution for pie chart
  const statusMap = new Map<string, { name: string; count: number; color: string }>();
  
  ordersInRange.forEach(order => {
    if (order.status) {
      const existing = statusMap.get(order.status.id);
      if (existing) {
        existing.count++;
      } else {
        statusMap.set(order.status.id, {
          name: order.status.name,
          count: 1,
          color: order.status.color,
        });
      }
    }
  });

  const statusDistribution = Array.from(statusMap.values());

  // Agent count (not filtered by date)
  const agentCount = await prisma.user.count({
    where: {
      role: { in: ["AGENT", "AGENT_TEST", "SUPERVISOR"] },
      status: "ACTIVE",
    },
  });

  // Agent performance stats (filtered by date range)
  const processedOrdersWithAgent = await prisma.order.findMany({
    where: {
      ...whereClause,
      agentId: { not: null },
      processingTimeMin: { not: null },
    },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Calculate stats per agent
  const agentStatsMap = new Map<string, { 
    name: string; 
    ordersProcessed: number; 
    totalProcessingTime: number;
  }>();

  processedOrdersWithAgent.forEach(order => {
    if (order.agent && order.processingTimeMin !== null) {
      const existing = agentStatsMap.get(order.agent.id);
      if (existing) {
        existing.ordersProcessed++;
        existing.totalProcessingTime += order.processingTimeMin;
      } else {
        agentStatsMap.set(order.agent.id, {
          name: order.agent.name || "Agent inconnu",
          ordersProcessed: 1,
          totalProcessingTime: order.processingTimeMin,
        });
      }
    }
  });

  // Convert to array and calculate averages
  const agentPerformance = Array.from(agentStatsMap.values())
    .map(agent => ({
      name: agent.name,
      ordersProcessed: agent.ordersProcessed,
      avgProcessingTime: Math.round(agent.totalProcessingTime / agent.ordersProcessed),
    }))
    .sort((a, b) => b.ordersProcessed - a.ordersProcessed) // Sort by orders processed (descending)
    .slice(0, 10); // Top 10 agents

  // Overall average processing time
  const totalProcessingTime = processedOrdersWithAgent
    .filter(o => o.processingTimeMin !== null)
    .reduce((sum, o) => sum + (o.processingTimeMin || 0), 0);
  
  const avgProcessingTime = processedOrdersWithAgent.length > 0
    ? Math.round(totalProcessingTime / processedOrdersWithAgent.length)
    : 0;

  return {
    totalOrders,
    processedOrders,
    toProcessOrders,
    toRecallOrders,
    statusDistribution,
    agentCount,
    agentPerformance,
    avgProcessingTime,
    dateRange: {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    },
  };
}

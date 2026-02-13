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
  
  // To Recall = orders with recallAt defined (GLOBAL - ignore date range filter as requested)
  const toRecallOrders = await prisma.order.count({
    where: {
      recallAt: { not: null }
    }
  });

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

  // ============ PHASE 1: REVENUE METRICS ============
  
  // Calculate total revenue for current period
  const totalRevenue = ordersInRange.reduce((sum, order) => sum + order.totalPrice, 0);
  
  // Calculate previous period for comparison
  const periodDuration = dateRange.end.getTime() - dateRange.start.getTime();
  const previousPeriodStart = new Date(dateRange.start.getTime() - periodDuration);
  const previousPeriodEnd = new Date(dateRange.start.getTime());
  
  const previousPeriodOrders = await prisma.order.findMany({
    where: {
      orderDate: {
        gte: previousPeriodStart,
        lte: previousPeriodEnd,
      },
    },
    select: {
      totalPrice: true,
      statusId: true,
    },
  });
  
  const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const previousTotalOrders = previousPeriodOrders.length;
  const previousProcessedOrders = previousPeriodOrders.filter(o => o.statusId !== null).length;
  
  // Calculate trends
  const revenueTrend = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  const orderTrend = previousTotalOrders > 0
    ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100
    : 0;
  
  // Calculate average basket
  const avgBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const previousAvgBasket = previousTotalOrders > 0 ? previousRevenue / previousTotalOrders : 0;
  const avgBasketTrend = previousAvgBasket > 0
    ? ((avgBasket - previousAvgBasket) / previousAvgBasket) * 100
    : 0;
  
  // ============ PHASE 1: ORDER EVOLUTION & REVENUE DATA ============
  
  // Group orders by day
  const dailyMap = new Map<string, { date: string; total: number; processed: number; pending: number; revenue: number; orders: number }>();
  
  ordersInRange.forEach(order => {
    const dateKey = order.orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const existing = dailyMap.get(dateKey);
    
    if (existing) {
      existing.total++;
      existing.orders++; // Same as total for this chart context
      existing.revenue += order.totalPrice;
      if (order.statusId !== null) existing.processed++;
      else existing.pending++;
    } else {
      dailyMap.set(dateKey, {
        date: dateKey,
        total: 1,
        orders: 1,
        revenue: order.totalPrice,
        processed: order.statusId !== null ? 1 : 0,
        pending: order.statusId === null ? 1 : 0,
      });
    }
  });
  
  const dailyStats = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(stat => ({
      ...stat,
      rate: stat.total > 0 ? Math.round((stat.processed / stat.total) * 100) : 0
    }));

  const orderEvolution = dailyStats.map(({ date, total, processed, pending }) => ({ date, total, processed, pending }));
  
  // ============ PHASE 1: PROCESSING RATE ============
  
  const processingRate = totalOrders > 0 ? (processedOrders / totalOrders) * 100 : 0;
  const previousProcessingRate = previousTotalOrders > 0 
    ? (previousProcessedOrders / previousTotalOrders) * 100 
    : 0;
  const processingRateTrend = previousProcessingRate > 0
    ? ((processingRate - previousProcessingRate) / previousProcessingRate) * 100
    : 0;

  // ============ PHASE 2: ORDERS BY WEEKDAY ============
  
  const ordersByWeekday = new Map<number, number>(); // 0 = Sunday, 1 = Monday, etc.
  
  ordersInRange.forEach(order => {
    const day = order.orderDate.getDay();
    ordersByWeekday.set(day, (ordersByWeekday.get(day) || 0) + 1);
  });
  
  const ordersByWeekdayData = Array.from({ length: 7 }, (_, i) => ({
    day: i, // Use index 0-6
    orders: ordersByWeekday.get(i) || 0,
  }));

  // ============ PHASE 2: TOP PRODUCTS ============
  
  // Fetch orders with their products
  const ordersWithProducts = await prisma.order.findMany({
    where: whereClause,
    include: {
      products: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
  
  const productCounts = new Map<string, { title: string; count: number; revenue: number }>();
  
  ordersWithProducts.forEach(order => {
    order.products.forEach(product => {
      const existing = productCounts.get(product.id);
      if (existing) {
        existing.count++;
      } else {
        productCounts.set(product.id, {
          title: product.title,
          count: 1,
          revenue: 0 // Placeholder if we don't fetch price
        });
      }
    });
  });

  // To get accurate revenue per product, we need product prices or order-lines. 
  
  const productsPerformance = await prisma.product.findMany({
     where: {
         orders: { some: whereClause }
     },
     include: {
         orders: {
             where: whereClause,
             select: { totalPrice: true }
         }
     }
  });

  const topProducts = productsPerformance
    .map(p => ({
      name: p.title,
      revenue: p.orders.reduce((sum, o) => sum + o.totalPrice, 0),
      count: p.orders.length
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);


  // ============ PHASE 2: PRICE DISTRIBUTION ============
  
  const priceRanges = [
    { key: "priceRangeLess100", min: 0, max: 100, count: 0 },
    { key: "priceRange100_500", min: 100, max: 500, count: 0 },
    { key: "priceRange500_1000", min: 500, max: 1000, count: 0 },
    { key: "priceRangeMore1000", min: 1000, max: Infinity, count: 0 },
  ];
  
  ordersInRange.forEach(order => {
    const price = order.totalPrice;
    for (const range of priceRanges) {
      if (price >= range.min && price < range.max) {
        range.count++;
        break;
      }
    }
  });
  
  const priceDistribution = priceRanges.map(r => ({
    rangeKey: r.key,
    count: r.count,
  }));

  // ============ PHASE 3: PROCESSING TIME TREND ============
  
  const processingTimeByDay = new Map<string, { total: number; count: number }>();
  
  processedOrdersWithAgent.forEach(order => {
    if (order.processingTimeMin !== null) {
      const dateKey = order.orderDate.toISOString().split('T')[0];
      const existing = processingTimeByDay.get(dateKey);
      
      if (existing) {
        existing.total += order.processingTimeMin;
        existing.count++;
      } else {
        processingTimeByDay.set(dateKey, {
          total: order.processingTimeMin,
          count: 1,
        });
      }
    }
  });
  
  const processingTimeTrend = Array.from(processingTimeByDay.entries())
    .map(([date, data]) => ({
      date,
      avgTime: Math.round(data.total / data.count),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ============ PHASE 3: DETAILED AGENT STATISTICS ============
  
  const detailedAgentStats = await prisma.user.findMany({
    where: {
      role: { in: ["AGENT", "AGENT_TEST", "SUPERVISOR"] },
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      role: true,
      orders: {
        where: whereClause,
        select: {
          id: true,
          statusId: true,
          processingTimeMin: true,
          recallAt: true,
        },
      },
    },
  });
  
  const agentsDetailed = detailedAgentStats.map(agent => {
    const totalAssigned = agent.orders.length;
    const processed = agent.orders.filter(o => o.statusId !== null).length;
    const processingRate = totalAssigned > 0 ? (processed / totalAssigned) * 100 : 0;
    
    const ordersWithTime = agent.orders.filter(o => o.processingTimeMin !== null);
    const avgTime = ordersWithTime.length > 0
      ? Math.round(ordersWithTime.reduce((sum, o) => sum + (o.processingTimeMin || 0), 0) / ordersWithTime.length)
      : 0;
    const toRecall = agent.orders.filter(o => o.recallAt !== null).length;
    
    return {
      id: agent.id,
      name: agent.name || "Agent inconnu",
      role: agent.role,
      totalAssigned,
      processed,
      processingRate: Math.round(processingRate),
      avgProcessingTime: avgTime,
      toRecall,
    };
  }).sort((a, b) => b.totalAssigned - a.totalAssigned);

  // ============ PHASE 3: RECALL TIMELINE ============
  
  const currentDate = new Date();
  const upcomingRecalls = await prisma.order.findMany({
    where: {
      recallAt: {
        gte: currentDate,
      },
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      recallAt: true,
      status: {
        select: {
          name: true,
          color: true,
        },
      },
      agent: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      recallAt: 'asc',
    },
    take: 20,
  });
  
  const recallTimeline = upcomingRecalls.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName || "Client inconnu",
    customerPhone: order.customerPhone || "",
    recallAt: order.recallAt?.toISOString() || "",
    statusName: order.status?.name || "Sans statut",
    statusColor: order.status?.color || "#6b7280",
    agentName: order.agent?.name || "Non assigné",
  }));

  const recentOrders = await prisma.order.findMany({
    orderBy: { orderDate: 'desc' },
    take: 10,
    include: {
      status: { select: { name: true } },
      agent: { select: { name: true } }
    }
  });

  return {
    totalOrders,
    orderTrend,
    processedOrders,
    toProcessOrders,
    toRecallOrders,
    statusDistribution,
    agentCount,
    agentPerformance,
    avgProcessingTime,
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName || "Inconnu",
      totalPrice: o.totalPrice,
      createdAt: o.createdAt,
      status: o.status,
      agent: o.agent
    })),
    dateRange: {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    },
    // Phase 1 additions
    revenue: {
      total: totalRevenue,
      trend: revenueTrend,
    },
    avgBasket: {
      value: avgBasket,
      trend: avgBasketTrend,
    },
    orderEvolution,
    dailyStats, // Added for new charts
    processingRate: {
      value: processingRate,
      trend: processingRateTrend,
    },
    // Phase 2 additions
    ordersByWeekday: ordersByWeekdayData,
    topProducts,
    priceDistribution,
    // Phase 3 additions
    processingTimeTrend,
    agentsDetailed,
    recallTimeline,
  };
}

export async function getAgentStats(agentId: string) {
  await checkPermission("canViewDashboard");
  const now = new Date();
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);
  
  const previousMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const previousMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const [currentMonthOrders, previousMonthOrders, totalOrders, recentOrders, allOrders] = await Promise.all([
    prisma.order.count({ where: { agentId, orderDate: { gte: startMonth, lte: endMonth } } }),
    prisma.order.count({ where: { agentId, orderDate: { gte: previousMonthStart, lte: previousMonthEnd } } }),
    prisma.order.count({ where: { agentId } }),
    prisma.order.findMany({ 
      where: { agentId }, 
      orderBy: { orderDate: 'desc' }, 
      take: 5,
      include: { status: true }
    }),
    prisma.order.findMany({
      where: { agentId, orderDate: { gte: startMonth, lte: endMonth } },
      include: { status: true }
    })
  ]);

  const ordersTrend = previousMonthOrders > 0 
    ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100 
    : 0;

  const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  // Status distribution
  const statusMap = new Map<string, { name: string; count: number; color: string }>();
  allOrders.forEach(order => {
    if (order.status) {
      const existing = statusMap.get(order.status.id);
      if (existing) existing.count++;
      else statusMap.set(order.status.id, { name: order.status.name, count: 1, color: order.status.color });
    }
  });

  // Calculate daily stats for charts
  const dailyMap = new Map<string, { date: string; orders: number; revenue: number }>();
  
  // Initialize daily map for the current month to ensure all days are present (optional, but good for charts)
  // For now, let's just map existing orders
  allOrders.forEach(order => {
    const dateKey = order.orderDate.toISOString().split('T')[0];
    const existing = dailyMap.get(dateKey);
    if (existing) {
      existing.orders++;
      existing.revenue += order.totalPrice;
    } else {
      dailyMap.set(dateKey, {
        date: dateKey,
        orders: 1,
        revenue: order.totalPrice
      });
    }
  });

  const dailyStats = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate confirmation rate (orders with status that implies success)
  // Assuming 'Livre' or 'Confirme' based statuses. 
  // Let's use a heuristic: status.name contains 'Livr' or 'Confirm'
  const confirmedCount = allOrders.filter(o => 
    o.status?.name?.toLowerCase().includes('livr') || 
    o.status?.name?.toLowerCase().includes('confirm')
  ).length;

  const confirmationRate = totalOrders > 0 ? (confirmedCount / totalOrders) * 100 : 0;

  // Calculate processing rate
  const processedCount = allOrders.filter(o => o.statusId !== null).length;
  const processingRateValue = allOrders.length > 0 ? (processedCount / allOrders.length) * 100 : 0;

  return {
    currentMonthOrders,
    ordersTrend,
    totalOrders,
    revenue: {
      total: totalRevenue,
      trend: 0, // Trend calculation for agent revenue would require previous revenue which we can add if needed
    },
    dailyStats, 
    processingRate: {
      value: processingRateValue,
      trend: 0 // Placeholder
    },
    confirmationRate, 
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName || "Inconnu",
      totalPrice: o.totalPrice,
      createdAt: o.createdAt,
      status: o.status
    })),
    statusDistribution: Array.from(statusMap.values())
  };
}

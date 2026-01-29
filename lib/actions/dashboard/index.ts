"use server";

import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";
import { checkPermission } from "../auth-helper";

export async function getAdminStats() {
  await checkPermission("canViewDashboard");

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    totalOrders,
    todayOrders,
    currentMonthOrders,
    lastMonthOrders,
    totalRevenue,
    orderStatusStats,
    agentCount,
    recentOrders,
  ] = await Promise.all([
    // Total orders
    prisma.order.count(),
    // Orders today
    prisma.order.count({
      where: {
        orderDate: { gte: todayStart, lte: todayEnd },
      },
    }),
    // Orders this month
    prisma.order.count({
      where: {
        orderDate: { gte: currentMonthStart, lte: currentMonthEnd },
      },
    }),
    // Orders last month
    prisma.order.count({
      where: {
        orderDate: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
    // Total revenue (using currentMonth as base for trend)
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { orderDate: { gte: currentMonthStart, lte: currentMonthEnd } },
    }),
    // Status distribution
    prisma.status.findMany({
      include: {
        _count: {
          select: { orders: true },
        },
      },
    }),
    // Active agents count
    prisma.user.count({
      where: { role: { in: ["AGENT", "AGENT_TEST"] } },
    }),
    // Recent orders
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        status: true,
        agent: { select: { name: true } },
      },
    }),
  ]);

  // Last month revenue for trend
  const lastMonthRevenue = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    where: { orderDate: { gte: lastMonthStart, lte: lastMonthEnd } },
  });

  const revenueTrend = lastMonthRevenue._sum.totalPrice 
    ? ((totalRevenue._sum.totalPrice || 0) - lastMonthRevenue._sum.totalPrice) / lastMonthRevenue._sum.totalPrice * 100
    : 100;

  const ordersTrend = lastMonthOrders
    ? (currentMonthOrders - lastMonthOrders) / lastMonthOrders * 100
    : 100;

  return {
    totalOrders,
    todayOrders,
    currentMonthOrders,
    ordersTrend: Math.round(ordersTrend),
    revenue: totalRevenue._sum.totalPrice || 0,
    revenueTrend: Math.round(revenueTrend),
    statusDistribution: orderStatusStats.map(s => ({
      name: s.name,
      count: s._count.orders,
    })),
    agentCount,
    recentOrders,
  };
}

export async function getAgentStats(agentId: string) {
  await checkPermission("canViewDashboard");

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    myTotalOrders,
    myCurrentMonthOrders,
    myLastMonthOrders,
    myTotalRevenue,
    myStatusStats,
    myRecentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { agentId } }),
    prisma.order.count({
      where: { agentId, orderDate: { gte: currentMonthStart, lte: currentMonthEnd } },
    }),
    prisma.order.count({
      where: { agentId, orderDate: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { agentId, orderDate: { gte: currentMonthStart, lte: currentMonthEnd } },
    }),
    prisma.status.findMany({
      include: {
        _count: {
          select: {
            orders: { where: { agentId } },
          },
        },
      },
    }),
    prisma.order.findMany({
      where: { agentId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        status: true,
      },
    }),
  ]);

  const ordersTrend = myLastMonthOrders
    ? (myCurrentMonthOrders - myLastMonthOrders) / myLastMonthOrders * 100
    : 100;

  return {
    totalOrders: myTotalOrders,
    currentMonthOrders: myCurrentMonthOrders,
    ordersTrend: Math.round(ordersTrend),
    revenue: myTotalRevenue._sum.totalPrice || 0,
    statusDistribution: myStatusStats.map(s => ({
      name: s.name,
      count: s._count.orders,
    })).filter(s => s.count > 0),
    recentOrders: myRecentOrders,
  };
}

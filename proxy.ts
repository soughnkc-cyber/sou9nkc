import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

import { canAccessRoute, Permissions } from "./lib/auth-utils";
import prisma from "@/lib/prisma";


export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return null;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return null;
  }

  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // 🔹 Permission / RBAC checks
  if (isLoggedIn && token?.id) {
    // Récupère les permissions fraîches depuis la DB pour éviter de devoir se reconnecter
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: {
        role: true,
        canViewOrders: true,
        canEditOrders: true,
        canViewUsers: true,
        canEditUsers: true,
        canViewProducts: true,
        canEditProducts: true,
        canViewStatuses: true,
        canEditStatuses: true,
        canViewReporting: true,
        canViewDashboard: true,
      }
    });

    if (!dbUser) {
      return NextResponse.redirect(new URL("/auth/signin", nextUrl));
    }

    if (!canAccessRoute(dbUser.role, dbUser, nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    // Update lastSeenAt as heartbeat
    await prisma.user.update({
      where: { id: token.id as string },
      data: { lastSeenAt: new Date() }
    });
  }


  return null;
}


// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

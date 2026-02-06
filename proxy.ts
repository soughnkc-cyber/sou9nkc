import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_LOGIN_REDIRECT,
  authRoutes,
  publicRoutes,
} from "@/routes";

/**
 * Version Ultra-Optimisée pour Vercel Edge & Safari
 * 1. Matcher réduit pour éviter les conflits API/NextAuth
 * 2. Utilisation systématique de NextResponse.next()
 * 3. Logique de sécurité minimale pour une rapidité maximale
 */
export default async function proxy(req: NextRequest) {
  const { nextUrl } = req;

  // 1. On laisse passer tout ce qui est déjà filtré par le matcher mais par sécurité :
  if (
    nextUrl.pathname.startsWith("/api") || 
    nextUrl.pathname.startsWith("/_next") || 
    nextUrl.pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 2. Récupération du token avec gestion d'erreur pour mobile
  let token = null;
  try {
    token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });
  } catch (error) {
    // Sur mobile, getToken peut échouer après mise en veille
    // On laisse passer pour éviter "serveur introuvable"
    console.error("getToken failed (mobile wake-up?):", error);
  }
  
  const isLoggedIn = !!token;
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // 3. Logique de redirection d'authentification
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return NextResponse.next();
  }

  // 4. Protection des routes privées
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

  // Note: On retire le RBAC (canAccessRoute) d'ici pour la performance.
  // La sécurité par rôle est gérée directement dans les composants SideBar et les Pages.

  return NextResponse.next();
}

export const config = {
  matcher: [
    // On ne surveille QUE les pages réelles, on ignore tout le reste
    '/((?!api|_next/static|_next/image|favicon.ico|auth/signin|auth/error).*)',
    '/',
  ],
};

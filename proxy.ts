import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import {
  DEFAULT_LOGIN_REDIRECT,
  authRoutes,
  publicRoutes,
} from "@/routes";

const intlMiddleware = createMiddleware(routing);

/**
 * Version Ultra-Optimisée pour Vercel Edge & Safari
 * Intégrant next-intl pour le support multi-langue
 */
export default async function proxy(req: NextRequest) {
  const { nextUrl } = req;

  // 1. On laisse passer tout ce qui ne doit pas être traité par le middleware
  if (
    nextUrl.pathname.startsWith("/api") || 
    nextUrl.pathname.startsWith("/_next") || 
    nextUrl.pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 2. Internationalisation avec next-intl
  // On laisse next-intl gérer les redirections de locale (ex: / -> /fr)
  const response = intlMiddleware(req);
  
  // Si next-intl souhaite faire une redirection (ex: ajout de la locale), on retourne sa réponse
  if (response.status !== 200 && response.headers.get('location')) {
    return response;
  }

  // 3. Récupération du token pour l'authentification
  let token = null;
  try {
    token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });
  } catch (error) {
    console.error("getToken failed (mobile wake-up?):", error);
  }
  
  const isLoggedIn = !!token;
  
  // On ajuste les chemins pour ignorer le préfixe de langue dans la logique d'auth
  const pathname = nextUrl.pathname.replace(/^\/(fr|ar)/, '') || '/';
  
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  // 4. Logique de redirection d'authentification
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return response; // On garde la réponse d'intl (si elle a injecté des headers)
  }

  // 5. Protection des routes privées
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    
    // On redirige vers /auth/signin (sans locale préfixée pour l'instant, ou avec si nécessaire)
    // Ici on laisse la redirection vers le chemin par défaut (/auth/signin) car next-intl le gérera au prochain tour
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  return response;
}

export const config = {
  matcher: [
    // On surveille les pages avec ou sans locale
    '/',
    '/(fr|ar)/:path*',
    // On ignore les fichiers statiques
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "phone" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Phone et mot de passe requis");
        }

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
        });

        if (!user) {
          throw new Error("Aucun compte trouvé avec ce numéro");
        }

        if (user.status !== "ACTIVE") {
          throw new Error("Votre compte est bloqué. Veuillez contacter l'administrateur.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValid) {
             throw new Error("Mot de passe incorrect");
        }

        return {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          // Permissions
          canViewOrders: user.canViewOrders,
          canEditOrders: user.canEditOrders,
          canViewUsers: user.canViewUsers,
          canEditUsers: user.canEditUsers,
          canViewProducts: user.canViewProducts,
          canEditProducts: user.canEditProducts,
          canViewStatuses: user.canViewStatuses,
          canEditStatuses: user.canEditStatuses,
          canViewReporting: user.canViewReporting,
          canViewDashboard: user.canViewDashboard,
          iconColor: user.iconColor,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.name = user.name;
        // Permissions
        token.canViewOrders = user.canViewOrders;
        token.canEditOrders = user.canEditOrders;
        token.canViewUsers = user.canViewUsers;
        token.canEditUsers = user.canEditUsers;
        token.canViewProducts = user.canViewProducts;
        token.canEditProducts = user.canEditProducts;
        token.canViewStatuses = user.canViewStatuses;
        token.canEditStatuses = user.canEditStatuses;
        token.canViewReporting = user.canViewReporting;
        token.canViewDashboard = user.canViewDashboard;
        token.iconColor = user.iconColor;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string;
        session.user.name = token.name as string;
        // Permissions
        session.user.canViewOrders = token.canViewOrders;
        session.user.canEditOrders = token.canEditOrders;
        session.user.canViewUsers = token.canViewUsers;
        session.user.canEditUsers = token.canEditUsers;
        session.user.canViewProducts = token.canViewProducts;
        session.user.canEditProducts = token.canEditProducts;
        session.user.canViewStatuses = token.canViewStatuses;
        session.user.canEditStatuses = token.canEditStatuses;
        session.user.canViewReporting = token.canViewReporting;
        session.user.canViewDashboard = token.canViewDashboard;
        session.user.iconColor = token.iconColor;
      }
      return session;
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  events: {
    async signIn({ user }: any) {
    // utilisateur connecté
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLoginAt: new Date(),
        lastLogoutAt: null, // remise à zéro
      },
    });
  },

  async signOut({ token }: any) {
    if (!token?.id) return;

    // utilisateur déconnecté
    await prisma.user.update({
      where: { id: token.id },
      data: { lastLogoutAt: new Date() },
    });
  },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

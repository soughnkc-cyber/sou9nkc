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
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
     maxAge: 60 * 60, // 1 heure
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string;
        session.user.name = token.name as string;
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
      data: { lastLoginAt: new Date() },
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

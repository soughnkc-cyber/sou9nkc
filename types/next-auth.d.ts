import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "SUPERVISOR" | "AGENT" | "AGENT_TEST";
      name?: string | null;
      phone?: string | null;
    };
  }
}

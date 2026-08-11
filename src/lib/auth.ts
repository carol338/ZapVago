/**
 * Configuração do NextAuth — login por email/senha do dono do negócio.
 */
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const owner = await prisma.owner.findUnique({
          where: { email: credentials.email },
          include: { business: true },
        });
        if (!owner) return null;

        const valid = await bcrypt.compare(credentials.password, owner.password);
        if (!valid) return null;

        return {
          id: owner.id,
          email: owner.email,
          name: owner.name,
          businessId: owner.businessId,
          businessName: owner.business.name,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.businessId = (user as any).businessId;
        token.businessName = (user as any).businessName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).businessId = token.businessId;
        (session.user as any).businessName = token.businessName;
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};

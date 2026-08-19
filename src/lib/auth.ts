/**
 * Configuração do NextAuth — login por email/senha do dono do negócio.
 */
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Não há uma rota /api/auth/login própria — o login passa inteiro por
        // aqui (POST /api/auth/callback/credentials), então é aqui que o rate
        // limit de login precisa entrar, não numa rota que não existe.
        const ip = getClientIp(req.headers);
        const ipCheck = await checkRateLimit(`login:ip:${ip}`, 10, 15 * 60);
        if (!ipCheck.allowed) {
          throw new Error("Muitas tentativas de login. Aguarde alguns minutos e tente novamente.");
        }

        const emailCheck = await checkRateLimit(`login:email:${credentials.email.toLowerCase().trim()}`, 5, 15 * 60);
        if (!emailCheck.allowed) {
          throw new Error("Muitas tentativas para este e-mail. Aguarde alguns minutos e tente novamente.");
        }

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

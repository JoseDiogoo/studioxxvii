import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isLoginRateLimited, registerFailedLogin, clearLoginAttempts } from "@/lib/rate-limit";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/equipa/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        if (isLoginRateLimited(email)) {
          throw new Error("Demasiadas tentativas. Tenta novamente daqui a uns minutos.");
        }

        const colaborador = await prisma.colaborador.findUnique({ where: { email } });
        if (!colaborador || !colaborador.ativo) {
          registerFailedLogin(email);
          return null;
        }

        const valid = await bcrypt.compare(password, colaborador.passwordHash);
        if (!valid) {
          registerFailedLogin(email);
          return null;
        }

        clearLoginAttempts(email);
        return {
          id: colaborador.id,
          name: colaborador.nome,
          email: colaborador.email,
          salaoId: colaborador.salaoId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.colaboradorId = user.id;
        token.salaoId = user.salaoId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.colaboradorId;
        session.user.salaoId = token.salaoId;
      }
      return session;
    },
  },
};

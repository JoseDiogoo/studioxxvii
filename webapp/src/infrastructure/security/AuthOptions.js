import CredentialsProvider from "next-auth/providers/credentials";
import { RateLimiter } from "./RateLimiter";
import { PostgresColaboradorRepository } from "../database/repositories/PostgresColaboradorRepository";
import { BcryptPasswordHasher } from "../gateways/BcryptPasswordHasher";
import { AutenticarColaboradorUseCase } from "@/application/use-cases/colaborador/AutenticarColaboradorUseCase";

const colaboradorRepo = new PostgresColaboradorRepository();
const passwordHasher = new BcryptPasswordHasher();
const autenticarUseCase = new AutenticarColaboradorUseCase({
  colaboradorRepository: colaboradorRepo,
  passwordHasher,
});

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

        if (RateLimiter.isLoginRateLimited(email)) {
          throw new Error("Demasiadas tentativas. Tenta novamente daqui a uns minutos.");
        }

        const usuario = await autenticarUseCase.execute({ email, password });
        if (!usuario) {
          RateLimiter.registarTentativaLogin(email, false);
          return null;
        }

        RateLimiter.registarTentativaLogin(email, true);
        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          salaoId: usuario.salaoId,
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

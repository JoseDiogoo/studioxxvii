import CredentialsModule from "next-auth/providers/credentials";
import { RateLimiter } from "./RateLimiter";
import { PostgresColaboradorRepository } from "../database/repositories/PostgresColaboradorRepository";
import { BcryptPasswordHasher } from "../gateways/BcryptPasswordHasher";
import { AutenticarColaboradorUseCase } from "@/application/use-cases/colaborador/AutenticarColaboradorUseCase";

// Com "type": "module" o import por omissão de um pacote CJS devolve o exports inteiro.
const CredentialsProvider = CredentialsModule.default ?? CredentialsModule;

const colaboradorRepo = new PostgresColaboradorRepository();
const passwordHasher = new BcryptPasswordHasher();
const autenticarUseCase = new AutenticarColaboradorUseCase({
  colaboradorRepository: colaboradorRepo,
  passwordHasher,
});

// Em produção o arranque falha se o segredo for fraco ou ainda for o valor de exemplo: sessões assinadas com ele seriam falsificáveis.
if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
  const segredo = process.env.NEXTAUTH_SECRET || "";
  if (segredo.length < 32 || segredo === "troca-isto") {
    throw new Error("NEXTAUTH_SECRET em falta ou fraco (mínimo 32 caracteres). Gera um com: openssl rand -base64 32");
  }
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // Sessão de 7 dias (o padrão do next-auth são 30) e renovada a cada 12 h de uso.
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60, updateAge: 12 * 60 * 60 },
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
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        // Limite por email+IP: quem erra a password é bloqueado, mas um desconhecido não consegue trancar o barbeiro de fora.
        const chave = `${email}|${RateLimiter.ipDoPedido(req)}`;
        // Teto por IP contra quem tenta muitos emails diferentes.
        if (RateLimiter.excedeu(`login-ip:${RateLimiter.ipDoPedido(req)}`, 30, 15 * 60_000)) {
          console.warn(`[seguranca] login bloqueado: demasiadas tentativas do ip ${RateLimiter.ipDoPedido(req)}`);
          throw new Error("Demasiadas tentativas. Tenta novamente daqui a uns minutos.");
        }
        if (RateLimiter.isLoginRateLimited(chave)) {
          console.warn(`[seguranca] login bloqueado: ${email} (ip ${RateLimiter.ipDoPedido(req)})`);
          throw new Error("Demasiadas tentativas. Tenta novamente daqui a uns minutos.");
        }

        const usuario = await autenticarUseCase.execute({ email, password });
        if (!usuario) {
          console.warn(`[seguranca] login falhado: ${email} (ip ${RateLimiter.ipDoPedido(req)})`);
          RateLimiter.registarTentativaLogin(chave, false);
          return null;
        }

        RateLimiter.registarTentativaLogin(chave, true);
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

import NextAuthModule from "next-auth";
import { authOptions } from "@/infrastructure/security/AuthOptions";

// Com "type": "module" o import por omissão de um pacote CJS devolve o exports inteiro.
const NextAuth = NextAuthModule.default ?? NextAuthModule;
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

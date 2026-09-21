import NextAuth from "next-auth";
import { authOptions } from "@/infrastructure/security/AuthOptions";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

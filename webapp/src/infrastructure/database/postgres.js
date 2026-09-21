import { PrismaClient } from "@prisma/client";

const globalForPostgres = globalThis;

/**
 * Cliente de acesso à base de dados PostgreSQL.
 * Em desenvolvimento, preserva a instância global para evitar exaustão de conexões no hot reload.
 */
export const postgresDb = globalForPostgres.postgresDb ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresDb = postgresDb;
}

// Alias para compatibilidade
export const db = postgresDb;
export const prisma = postgresDb;

import { NextResponse } from "next/server";
import { postgresDb } from "@/infrastructure/database/postgres";

export const dynamic = "force-dynamic";

// Para monitorização de uptime: 200 se a BD responde, 503 se não.
export async function GET() {
  try {
    await postgresDb.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

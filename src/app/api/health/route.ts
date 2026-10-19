import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  await db.$queryRaw`SELECT 1`;
  return Response.json({ ok: true, db: "connected" });
}

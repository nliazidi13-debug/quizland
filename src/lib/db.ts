import "dotenv/config";
import "server-only";
import { PrismaClient } from "../../generated/prisma/client";

// Reused across hot-reloads in dev, and across requests within the same
// Worker isolate in production, so each call doesn't open a fresh
// connection on top of the last one.
const globalForPrisma = globalThis as unknown as {
  prisma?: Promise<PrismaClient>;
};

async function createClient(): Promise<PrismaClient> {
  // On Cloudflare Workers (deployed, or `opennextjs-cloudflare preview`),
  // the D1 binding is only reachable through the Workers runtime context —
  // there's no plain env var for it. Outside that runtime (plain
  // `next dev`/`next start`), getCloudflareContext throws, and we fall
  // back to the local SQLite file via better-sqlite3.
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    if (env.quizland_db) {
      const { PrismaD1 } = await import("@prisma/adapter-d1");
      return new PrismaClient({ adapter: new PrismaD1(env.quizland_db) });
    }
  } catch {
    // Not running inside the Workers runtime — fall through to local SQLite.
  }

  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({ url: `${process.env.DATABASE_URL}` });
  return new PrismaClient({ adapter });
}

export function getDb(): Promise<PrismaClient> {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

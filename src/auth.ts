import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getDb } from "@/lib/db";

// Lazy/async config: on Cloudflare the D1-backed Prisma client can only be
// built once the Workers request context is available, so the adapter
// can't be constructed at module load time the way it could with a plain
// local SQLite file. See https://authjs.dev/reference/nextjs#lazy-initialization
export const { handlers, auth, signIn, signOut } = NextAuth(async () => ({
  adapter: PrismaAdapter(await getDb()),
  providers: [Google],
  // Self-hosted on a non-default port (4250), not a platform Auth.js
  // auto-detects the host for (e.g. Vercel) — without this it rejects
  // every request with "UntrustedHost". See https://errors.authjs.dev/#untrustedhost
  trustHost: true,
}));

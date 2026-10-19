import { auth } from "@/auth";
import { getOrCreateProfile } from "@/lib/serverProfile";
import { createDuelMatch } from "@/lib/serverDuel";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { domains, level } = (await request.json()) as {
    domains: string[];
    level: number;
  };
  if (!Array.isArray(domains) || domains.length === 0) {
    return Response.json({ error: "invalid domains" }, { status: 400 });
  }

  const profile = await getOrCreateProfile(session.user.id);
  const matchId = await createDuelMatch(profile.id, domains, level);
  return Response.json({ id: matchId });
}

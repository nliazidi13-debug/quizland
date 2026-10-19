import { auth } from "@/auth";
import { claimDailyChallenge, getClaimedToday } from "@/lib/serverProfile";
import type { DailyChallengeId } from "@/lib/dailyChallenges";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = (await request.json()) as { id: DailyChallengeId };
  const profile = await claimDailyChallenge(session.user.id, id);
  if (!profile) {
    return Response.json({ error: "challenge not completed" }, { status: 400 });
  }
  const claimedToday = await getClaimedToday(session.user.id);
  return Response.json({ ...profile, claimedToday });
}

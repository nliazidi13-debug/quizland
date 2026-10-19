import { auth } from "@/auth";
import { getOrCreateProfile } from "@/lib/serverProfile";
import { finishDuelParticipant } from "@/lib/serverDuel";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const result = (await request.json()) as {
    score: number;
    total: number;
    xp: number;
    timeSeconds: number;
  };

  const profile = await getOrCreateProfile(session.user.id);
  const match = await finishDuelParticipant(id, profile.id, result);
  if (!match) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(match);
}

import { auth } from "@/auth";
import { getOrCreateProfile } from "@/lib/serverProfile";
import { joinDuelMatch } from "@/lib/serverDuel";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const profile = await getOrCreateProfile(session.user.id);
  const match = await joinDuelMatch(id, profile.id);
  if (!match) {
    return Response.json({ error: "match full or not found" }, { status: 409 });
  }
  return Response.json(match);
}

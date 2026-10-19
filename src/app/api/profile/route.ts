import { auth } from "@/auth";
import { getClaimedToday, getOrCreateProfile, updateAvatar } from "@/lib/serverProfile";
import { avatarIds } from "@/lib/data";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const [profile, claimedToday] = await Promise.all([
    getOrCreateProfile(session.user.id),
    getClaimedToday(session.user.id),
  ]);
  return Response.json({ ...profile, claimedToday });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = await request.json();
  if (typeof body.avatar !== "string" || !avatarIds.includes(body.avatar)) {
    return Response.json({ error: "invalid avatar" }, { status: 400 });
  }
  const profile = await updateAvatar(session.user.id, body.avatar);
  return Response.json(profile);
}

import { auth } from "@/auth";
import { importLocalProfile } from "@/lib/serverProfile";
import type { PlayerProfile } from "@/lib/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const local = (await request.json()) as PlayerProfile;
  const profile = await importLocalProfile(session.user.id, local);
  if (!profile) {
    return Response.json(
      { error: "cloud profile already has progress" },
      { status: 409 }
    );
  }
  return Response.json(profile);
}

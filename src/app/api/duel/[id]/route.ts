import { auth } from "@/auth";
import { getDuelMatch } from "@/lib/serverDuel";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const match = await getDuelMatch(id);
  if (!match) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(match);
}

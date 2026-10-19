import { auth } from "@/auth";
import { recordQuizResult } from "@/lib/serverProfile";
import type { QuizResult } from "@/lib/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const result = (await request.json()) as QuizResult;
  const profile = await recordQuizResult(session.user.id, result);
  return Response.json(profile);
}

import { getLeaderboard } from "@/lib/serverProfile";

export async function GET() {
  const leaderboard = await getLeaderboard(50);
  return Response.json(leaderboard);
}

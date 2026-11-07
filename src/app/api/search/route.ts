import { getRepository } from "@/lib/data";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limit = rateLimit(clientKey(request, "search"), 60, 60_000);
  if (!limit.ok) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.trim().length < 2) {
    return Response.json({ groups: [] }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const groups = await getRepository().search(query);
    return Response.json({ groups }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ groups: [], error: "Search is temporarily unavailable" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  const rows = await q(
    "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30",
    [userId]
  );
  return NextResponse.json({ notifications: rows });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  const { ids } = await req.json().catch(() => ({}));
  if (Array.isArray(ids) && ids.length) {
    await q("UPDATE notifications SET read = true WHERE id = ANY($1) AND user_id = $2", [ids, userId]);
  }
  return NextResponse.json({ ok: true });
}

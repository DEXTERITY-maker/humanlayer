import { NextResponse } from "next/server";
import { q, rowToUser } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const amount = Math.max(1, Math.min(100000, Number(body.amount) || 0));
  if (amount <= 0) return NextResponse.json({ error: "Неверная сумма" }, { status: 400 });

  await q("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, id]);
  const rows = await q("SELECT * FROM users WHERE id = $1", [id]);
  return NextResponse.json({ user: rowToUser(rows[0]) });
}

import { NextResponse } from "next/server";
import { q, rowToUser } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ user: null });
  const rows = await q("SELECT * FROM users WHERE id = $1", [id]);
  if (rows.length === 0) return NextResponse.json({ user: null });
  return NextResponse.json({ user: rowToUser(rows[0]) });
}

export async function PATCH(req: Request) {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, city, phone, telegram, skills, hourlyRate } = body;

  const sets: string[] = [];
  const vals: unknown[] = [];
  if (typeof name === "string" && name.trim()) { vals.push(name.trim()); sets.push(`name = $${vals.length}`); }
  if (typeof city === "string") { vals.push(city); sets.push(`city = $${vals.length}`); }
  if (typeof phone === "string") { vals.push(phone); sets.push(`phone = $${vals.length}`); }
  if (typeof telegram === "string") { vals.push(telegram); sets.push(`telegram = $${vals.length}`); }
  if (Array.isArray(skills)) { vals.push(skills); sets.push(`skills = $${vals.length}`); }
  if (typeof hourlyRate === "number") { vals.push(hourlyRate); sets.push(`hourly_rate = $${vals.length}`); }
  if (sets.length === 0) return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400 });

  vals.push(id);
  await q(`UPDATE users SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
  const rows = await q("SELECT * FROM users WHERE id = $1", [id]);
  return NextResponse.json({ user: rowToUser(rows[0]) });
}

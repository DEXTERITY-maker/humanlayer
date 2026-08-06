import { NextResponse } from "next/server";
import { q, publicUser } from "@/lib/db";

/** Публичные профили (без email/пароля/баланса) — для кандидатов и имён */
export async function GET() {
  const rows = await q("SELECT * FROM users ORDER BY rating DESC");
  return NextResponse.json({ users: rows.map(publicUser) });
}

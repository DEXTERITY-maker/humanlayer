import { NextResponse } from "next/server";
import { q, rowToUser } from "@/lib/db";
import { setSession, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Введите email и пароль" }, { status: 400 });
  }

  const rows = await q("SELECT * FROM users WHERE email = $1", [String(email).trim().toLowerCase()]);
  const user = rows[0];
  if (!user || !verifyPassword(String(password), user.password_hash)) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  await setSession(user.id);
  return NextResponse.json({ user: rowToUser(user) });
}

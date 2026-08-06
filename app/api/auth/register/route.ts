import { NextResponse } from "next/server";
import { q, rowToUser } from "@/lib/db";
import { hashPassword, setSession } from "@/lib/auth";
import { uid } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password, role, city, skills, hourlyRate } = body;

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
  }
  if (role !== "executor" && role !== "customer") {
    return NextResponse.json({ error: "Неверная роль" }, { status: 400 });
  }
  const normEmail = String(email).trim().toLowerCase();

  const existing = await q("SELECT id FROM users WHERE email = $1", [normEmail]);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Пользователь с таким email уже есть" }, { status: 409 });
  }

  const id = uid();
  const now = Date.now();
  const balance = role === "customer" ? 2000 : 1000;
  await q(
    `INSERT INTO users (id,name,email,password_hash,role,city,skills,hourly_rate,balance,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [id, String(name).trim(), normEmail, hashPassword(String(password)), role, city || "Москва", skills ?? [], Number(hourlyRate) || 0, balance, now]
  );

  await setSession(id);
  const rows = await q("SELECT * FROM users WHERE id = $1", [id]);
  return NextResponse.json({ user: rowToUser(rows[0]) });
}

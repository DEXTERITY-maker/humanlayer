import { NextResponse } from "next/server";
import { q, rowToTask, withTx } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { uid } from "@/lib/types";

// GET /api/tasks?city=&category=&status=&q=&page=&limit= — список заданий
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const qText = searchParams.get("q");

  const conds: string[] = [];
  const vals: unknown[] = [];
  if (city) {
    vals.push(city);
    conds.push(`city = $${vals.length}`);
  }
  if (category) {
    vals.push(category);
    conds.push(`category = $${vals.length}`);
  }
  if (status) {
    vals.push(status);
    conds.push(`status = $${vals.length}`);
  }
  if (qText) {
    vals.push(`%${qText}%`);
    conds.push(`(title ILIKE $${vals.length} OR description ILIKE $${vals.length})`);
  }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const rows = await q(`SELECT * FROM tasks ${where} ORDER BY created_at DESC`, vals);
  return NextResponse.json({ tasks: rows.map(rowToTask) });
}

// POST /api/tasks — создание задания (только заказчик, эскроу: бюджет списывается сразу)
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, description, category, city, location, deadline, budget, hourly, skills } = body;

  if (!String(title ?? "").trim() || !String(description ?? "").trim()) {
    return NextResponse.json({ error: "Заполните название и описание" }, { status: 400 });
  }
  const budgetN = Math.max(0, Number(budget) || 0);
  if (budgetN <= 0) {
    return NextResponse.json({ error: "Вознаграждение должно быть больше нуля" }, { status: 400 });
  }

  const me = await q("SELECT * FROM users WHERE id = $1", [userId]);
  if (me.length === 0) return NextResponse.json({ error: "Пользователь не найден" }, { status: 401 });
  if (me[0].role !== "customer") {
    return NextResponse.json({ error: "Нужен аккаунт заказчика" }, { status: 403 });
  }
  if (Number(me[0].balance) < budgetN) {
    return NextResponse.json({ error: "Недостаточно средств на балансе (эскроу)" }, { status: 400 });
  }

  const id = uid();
  const now = Date.now();
  await withTx(async (c) => {
    await c.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [budgetN, userId]);
    await c.query(
      `INSERT INTO tasks (id,title,description,category,city,location,deadline,budget,hourly,skills,status,customer_id,applications,proofs,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'open',$11,'[]','[]',$12)`,
      [
        id,
        String(title).trim(),
        String(description).trim(),
        String(category ?? "Другое"),
        String(city ?? "Москва"),
        String(location ?? ""),
        String(deadline ?? ""),
        budgetN,
        !!hourly,
        skills ?? [],
        userId,
        now,
      ]
    );
  });

  const rows = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  return NextResponse.json({ task: rowToTask(rows[0]) });
}

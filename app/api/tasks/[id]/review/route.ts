import { NextResponse } from "next/server";
import { q, withTx } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { uid } from "@/lib/types";

// POST /api/tasks/[id]/review — отзыв после выполнения (доступен обеим сторонам)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const rating = Math.max(1, Math.min(5, Number(body.rating) || 0));
  const comment = String(body.comment ?? "").trim();
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Оценка должна быть от 1 до 5" }, { status: 400 });
  }

  const tasks = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  if (tasks.length === 0) return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  const task = tasks[0];
  if (task.status !== "done") {
    return NextResponse.json({ error: "Отзыв можно оставить только после выполнения" }, { status: 400 });
  }
  if (task.customer_id !== userId && task.executor_id !== userId) {
    return NextResponse.json({ error: "Вы не участвовали в этом задании" }, { status: 403 });
  }

  // Кому пишем отзыв
  const toId = userId === task.customer_id ? task.executor_id : task.customer_id;
  if (!toId) return NextResponse.json({ error: "Некому писать отзыв" }, { status: 400 });

  // Проверка дубля
  const existing = await q("SELECT id FROM reviews WHERE task_id = $1 AND from_id = $2", [id, userId]);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Вы уже оставили отзыв" }, { status: 400 });
  }

  await withTx(async (c) => {
    await c.query(
      "INSERT INTO reviews (id, task_id, from_id, to_id, rating, comment, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [uid(), id, userId, toId, rating, comment, Date.now()]
    );
    // Обновить рейтинг получателя
    const stats = await c.query(
      "SELECT COUNT(*)::int AS cnt, COALESCE(AVG(rating),0) AS avg FROM reviews WHERE to_id = $1",
      [toId]
    );
    await c.query("UPDATE users SET rating = $1, reviews = $2 WHERE id = $3", [
      Math.round(stats.rows[0].avg * 10) / 10,
      stats.rows[0].cnt,
      toId,
    ]);
  });

  return NextResponse.json({ ok: true });
}

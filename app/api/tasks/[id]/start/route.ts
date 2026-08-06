import { NextResponse } from "next/server";
import { q, rowToTask } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// POST /api/tasks/[id]/start — запуск таймера (только назначенный исполнитель)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const { id } = await params;
  const tasks = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  if (tasks.length === 0) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }
  const task = tasks[0];
  if (task.executor_id !== userId) {
    return NextResponse.json({ error: "Таймер может запускать только назначенный исполнитель" }, { status: 403 });
  }
  if (task.status !== "in_progress") {
    return NextResponse.json({ error: "Таймер работает только для заданий в работе" }, { status: 400 });
  }

  await q("UPDATE tasks SET timer_started_at = $1 WHERE id = $2", [Date.now(), id]);
  const rows = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  return NextResponse.json({ task: rowToTask(rows[0]) });
}

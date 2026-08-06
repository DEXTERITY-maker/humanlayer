import { NextResponse } from "next/server";
import { q, rowToTask } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// POST /api/tasks/[id]/reject { comment } — заказчик отклоняет отчёт (review → in_progress с комментарием)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const comment = String(body.comment ?? "").trim() || "Работа не принята";

  const tasks = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  if (tasks.length === 0) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }
  const task = tasks[0];
  if (task.customer_id !== userId) {
    return NextResponse.json({ error: "Только заказчик может отклонить работу" }, { status: 403 });
  }
  if (task.status !== "review") {
    return NextResponse.json({ error: "Отклонить можно только работу на проверке" }, { status: 400 });
  }

  await q("UPDATE tasks SET status = 'in_progress', reject_comment = $1 WHERE id = $2", [
    comment,
    id,
  ]);
  const rows = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  return NextResponse.json({ task: rowToTask(rows[0]) });
}

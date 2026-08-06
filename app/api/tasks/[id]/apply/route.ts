import { NextResponse } from "next/server";
import { q, rowToTask } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// POST /api/tasks/[id]/apply — отклик исполнителя (open → pending)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const me = await q("SELECT role FROM users WHERE id = $1", [userId]);
  if (me.length === 0) return NextResponse.json({ error: "Пользователь не найден" }, { status: 401 });
  if (me[0].role !== "executor") {
    return NextResponse.json({ error: "Откликаться могут только исполнители" }, { status: 403 });
  }

  const { id } = await params;
  const tasks = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  if (tasks.length === 0) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }
  const task = tasks[0];
  if (task.status !== "open") {
    return NextResponse.json({ error: "Задание уже не открыто для откликов" }, { status: 400 });
  }
  const applications = task.applications ?? [];
  if (applications.some((a: { executorId: string }) => a.executorId === userId)) {
    return NextResponse.json({ error: "Вы уже откликнулись" }, { status: 400 });
  }

  const updated = [
    ...applications,
    { taskId: id, executorId: userId, at: Date.now() },
  ];
  await q(
    "UPDATE tasks SET applications = $1::jsonb, status = 'pending' WHERE id = $2",
    [JSON.stringify(updated), id]
  );
  const rows = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  return NextResponse.json({ task: rowToTask(rows[0]) });
}

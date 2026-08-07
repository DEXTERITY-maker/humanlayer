import { NextResponse } from "next/server";
import { q, rowToTask } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { notify } from "@/lib/notify";

// POST /api/tasks/[id]/assign { executorId } — заказчик назначает исполнителя (pending → in_progress)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const executorId = String(body.executorId ?? "");
  if (!executorId) {
    return NextResponse.json({ error: "Укажите исполнителя" }, { status: 400 });
  }

  const tasks = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  if (tasks.length === 0) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }
  const task = tasks[0];
  if (task.customer_id !== userId) {
    return NextResponse.json({ error: "Только заказчик может назначить исполнителя" }, { status: 403 });
  }
  if (task.status !== "pending" && task.status !== "open") {
    return NextResponse.json({ error: "Задание нельзя назначить в текущем статусе" }, { status: 400 });
  }

  const exec = await q("SELECT id FROM users WHERE id = $1", [executorId]);
  if (exec.length === 0) {
    return NextResponse.json({ error: "Исполнитель не найден" }, { status: 400 });
  }
  if (task.status === "pending") {
    const applied = (task.applications ?? []).some(
      (a: { executorId: string }) => a.executorId === executorId
    );
    if (!applied) {
      return NextResponse.json({ error: "Этот исполнитель не откликался на задание" }, { status: 400 });
    }
  }

  await q("UPDATE tasks SET executor_id = $1, status = 'in_progress' WHERE id = $2", [
    executorId,
    id,
  ]);
  const rows = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  try { await notify(executorId, "assign", `Вас назначили исполнителем на «${rows[0].title}»`, `/tasks/${id}`); } catch {}
  return NextResponse.json({ task: rowToTask(rows[0]) });
}

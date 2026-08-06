import { NextResponse } from "next/server";
import { q, rowToTask } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { uid } from "@/lib/types";

// POST /api/tasks/[id]/proof { proof: {type,name,dataUrl?,text?}, elapsedMs } — отчёт исполнителя (in_progress → review)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const proof = body.proof as
    | { type: string; name?: string; dataUrl?: string; text?: string }
    | undefined;
  const elapsedMs = Math.max(0, Number(body.elapsedMs) || 0);
  if (!proof || !["photo", "video", "text"].includes(proof.type)) {
    return NextResponse.json({ error: "Некорректное доказательство" }, { status: 400 });
  }

  const tasks = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  if (tasks.length === 0) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }
  const task = tasks[0];
  if (task.executor_id !== userId) {
    return NextResponse.json({ error: "Отчёт может отправлять только назначенный исполнитель" }, { status: 403 });
  }
  if (task.status !== "in_progress") {
    return NextResponse.json({ error: "Отчёт можно отправить только для задания в работе" }, { status: 400 });
  }

  const proofs = [
    ...(task.proofs ?? []),
    { ...proof, id: uid(), at: Date.now() },
  ];
  const timerTotalMs = (task.timer_total_ms ?? 0) + elapsedMs;
  await q(
    "UPDATE tasks SET proofs = $1::jsonb, timer_total_ms = $2, timer_started_at = NULL, status = 'review' WHERE id = $3",
    [JSON.stringify(proofs), timerTotalMs, id]
  );
  const rows = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  return NextResponse.json({ task: rowToTask(rows[0]) });
}

import { NextResponse } from "next/server";
import { q, rowToTask, withTx } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { notify } from "@/lib/notify";

// POST /api/tasks/[id]/accept — заказчик принимает работу: выплата исполнителю (review → done)
// Сумма: для почасовых — часы × ставка, но не больше бюджета; комиссия платформы 5%.
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
  if (task.customer_id !== userId) {
    return NextResponse.json({ error: "Только заказчик может принять работу" }, { status: 403 });
  }
  if (task.status !== "review") {
    return NextResponse.json({ error: "Принять можно только работу на проверке" }, { status: 400 });
  }
  if (!task.executor_id) {
    return NextResponse.json({ error: "У задания нет исполнителя" }, { status: 400 });
  }

  let amount = task.budget;
  if (task.hourly && task.timer_total_ms) {
    const execRows = await q("SELECT hourly_rate FROM users WHERE id = $1", [
      task.executor_id,
    ]);
    if (execRows.length > 0) {
      const hours = task.timer_total_ms / 3600000;
      amount = Math.min(task.budget, Math.round(hours * execRows[0].hourly_rate));
    }
  }
  const commission = Math.round(amount * 0.05);
  const payout = amount - commission;

  await withTx(async (c) => {
    await c.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [
      payout,
      task.executor_id,
    ]);
    await c.query("UPDATE tasks SET status = 'done' WHERE id = $1", [id]);
  });

  const rows = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  try { await notify(task.executor_id, "accept", `Работа по заданию принята!`, `/tasks/${id}`); } catch {}
  return NextResponse.json({ task: rowToTask(rows[0]), payout });
}

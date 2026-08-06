import { NextResponse } from "next/server";
import { q, rowToTask, publicUser } from "@/lib/db";

// GET /api/tasks/[id] — карточка задания + публичные профили заказчика/исполнителя
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }
  const task = rowToTask(rows[0]);
  const userIds = [task.customerId, task.executorId].filter(
    (x): x is string => Boolean(x)
  );
  const users = userIds.length
    ? await q("SELECT * FROM users WHERE id = ANY($1)", [userIds])
    : [];
  const byId = new Map(users.map((u) => [u.id, publicUser(u)]));
  return NextResponse.json({
    task,
    customer: byId.get(task.customerId) ?? null,
    executor: task.executorId ? (byId.get(task.executorId) ?? null) : null,
  });
}

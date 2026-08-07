import { NextResponse } from "next/server";
import { q, DbRow } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { uid } from "@/lib/types";
import { notify } from "@/lib/notify";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const { id } = await params;

  const rows = await q(
    `SELECT m.id, m.task_id, m.from_id, m.to_id, m.text, m.created_at,
            u.name AS from_name
     FROM messages m
     JOIN users u ON u.id = m.from_id
     WHERE m.task_id = $1 AND (m.from_id = $2 OR m.to_id = $2)
     ORDER BY m.created_at ASC
     LIMIT 100`,
    [id, userId]
  );

  return NextResponse.json({
    messages: rows.map((r: DbRow) => ({
      id: r.id,
      taskId: r.task_id,
      fromId: r.from_id,
      toId: r.to_id,
      text: r.text,
      fromName: r.from_name,
      createdAt: Number(r.created_at),
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Сообщение не может быть пустым" }, { status: 400 });

  const tasks = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  if (tasks.length === 0) return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  const task = tasks[0];

  const isParticipant = task.customer_id === userId || task.executor_id === userId;
  if (!isParticipant) {
    return NextResponse.json({ error: "Вы не участвуете в этом задании" }, { status: 403 });
  }

  const toId = userId === task.customer_id ? task.executor_id : task.customer_id;
  if (!toId) return NextResponse.json({ error: "Некому отправлять" }, { status: 400 });

  const now = Date.now();
  const msgId = uid();

  await q(
    "INSERT INTO messages (id, task_id, from_id, to_id, text, created_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [msgId, id, userId, toId, text, now]
  );

  try {
    await notify(toId, "message", `Новое сообщение по заданию «${task.title}»`, `/tasks/${id}`);
  } catch {}

  return NextResponse.json({
    message: {
      id: msgId,
      taskId: id,
      fromId: userId,
      toId,
      text,
      fromName: "",
      createdAt: now,
    },
  });
}

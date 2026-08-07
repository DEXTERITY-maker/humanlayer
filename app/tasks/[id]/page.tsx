import { q, rowToTask, rowToUser } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { notFound } from "next/navigation";
import TaskDetailClient from "./TaskDetailClient";
import type { Metadata } from "next";
import type { Application, User } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const rows = await q("SELECT title, description FROM tasks WHERE id = $1", [id]);
  if (rows.length === 0) return {};
  return {
    title: `${rows[0].title} — HumanLayer`,
    description: String(rows[0].description).slice(0, 160),
  };
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getSessionUserId();

  const tasks = await q("SELECT * FROM tasks WHERE id = $1", [id]);
  if (tasks.length === 0) notFound();

  const task = rowToTask(tasks[0]);

  // Заказчик
  const custRows = await q("SELECT * FROM users WHERE id = $1", [task.customerId]);
  const customer: User | null = custRows.length > 0 ? rowToUser(custRows[0]) : null;

  // Исполнитель
  let executor: User | null = null;
  if (task.executorId) {
    const execRows = await q("SELECT * FROM users WHERE id = $1", [task.executorId]);
    executor = execRows.length > 0 ? rowToUser(execRows[0]) : null;
  }

  // Кандидаты
  const appIds: string[] = task.applications.map((a: Application) => a.executorId);
  let candidates: User[] = [];
  if (appIds.length > 0) {
    const candRows = await q("SELECT * FROM users WHERE id = ANY($1)", [appIds]);
    candidates = candRows.map(rowToUser);
  }

  return (
    <TaskDetailClient
      task={task}
      customer={customer}
      executor={executor}
      candidates={candidates}
      currentUserId={userId}
    />
  );
}

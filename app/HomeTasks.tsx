import { q, rowToTask } from "@/lib/db";
import TaskCard from "@/components/TaskCard";
import type { Task } from "@/lib/types";

export default async function HomeTasks() {
  let tasks: Task[] = [];
  try {
    const rows = await q(
      "SELECT * FROM tasks WHERE status = 'open' ORDER BY created_at DESC LIMIT 3"
    );
    tasks = rows.map(rowToTask);
  } catch {
    // БД недоступна — пустая секция
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-800/40 p-8 text-center">
        <p className="text-muted">Пока нет открытых заданий.</p>
        <a href="/register?role=customer" className="mt-3 inline-block text-sm font-semibold text-accent-400 hover:text-accent-300">
          Станьте первым заказчиком →
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} compact />
      ))}
    </div>
  );
}

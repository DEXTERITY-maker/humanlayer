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

  if (tasks.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} compact />
      ))}
    </div>
  );
}

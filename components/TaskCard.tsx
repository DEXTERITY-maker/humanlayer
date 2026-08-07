"use client";

import Link from "next/link";
import type { Task } from "@/lib/types";
import { STATUS_COLOR, STATUS_LABEL, fmt, fmtDate } from "@/lib/types";
import { IconClock, IconCoins, IconMapPin } from "@/components/icons";
import { useStore } from "@/components/AppProvider";

export default function TaskCard({ task, compact }: { task: Task; compact?: boolean }) {
  const { users } = useStore();
  const customer = users.find(u => u.id === task.customerId);

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="card group block p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-500/50 hover:shadow-[0_8px_32px_rgba(255,138,0,0.08)]"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="chip">{task.category}</span>
        <span className={`badge border ${STATUS_COLOR[task.status]}`}>{STATUS_LABEL[task.status]}</span>
      </div>

      <h3 className="mb-1.5 text-base font-bold leading-snug transition-colors group-hover:text-accent-400">
        {task.title}
      </h3>
      {!compact && (
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted">{task.description}</p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <IconMapPin size={13} />
          {task.city}
          {task.location ? ` · ${task.location}` : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <IconClock size={13} />
          до {fmtDate(task.deadline)}
        </span>
      </div>

      {task.skills.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {task.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-md bg-navy-700/60 px-2 py-0.5 text-[11px] text-muted">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-navy-700/70 pt-3">
        {customer && (
          <Link href={`/users/${task.customerId}`} className="text-xs text-muted hover:text-accent-400">
            {customer.name}
          </Link>
        )}
        <span className="inline-flex items-center gap-1.5 font-bold text-accent-400">
          <IconCoins size={16} />
          {fmt(task.budget)}
          {task.hourly && <span className="text-[11px] font-medium text-muted">/ час</span>}
        </span>
        <span className="text-xs font-medium text-muted transition-colors group-hover:text-accent-400">
          Подробнее →
        </span>
      </div>
    </Link>
  );
}

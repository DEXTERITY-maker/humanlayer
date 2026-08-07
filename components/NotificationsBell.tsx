"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/components/AppProvider";
import { j } from "@/lib/api";
import { IconBell, IconChat, IconCheck, IconUser, IconX, IconZap } from "@/components/icons";

interface Notif {
  id: string;
  type: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string | number;
}

const typeIcon = (t: string) => {
  switch (t) {
    case "apply":
      return <IconUser size={14} />;
    case "assign":
      return <IconZap size={14} />;
    case "accept":
      return <IconCheck size={14} />;
    case "reject":
      return <IconX size={14} />;
    default:
      return <IconChat size={14} />;
  }
};

const rel = (ts: number) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return d === 1 ? "вчера" : `${d} дн назад`;
};

export default function NotificationsBell() {
  const { current } = useStore();
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const userId = current?.id;

  // Загрузка при входе + поллинг каждые 30 сек (все setState — асинхронные)
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    const load = async () => {
      try {
        const d = await j<{ notifications: Notif[] }>("/api/notifications");
        if (alive) setItems(d.notifications);
      } catch {
        // нет сессии / API недоступен — тихо
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [userId]);

  // Закрытие по клику вне дропдауна
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const openBox = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length) {
        try {
          await j("/api/notifications", {
            method: "PATCH",
            body: JSON.stringify({ ids: unreadIds }),
          });
          setItems((prev) =>
            prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read: true } : n))
          );
        } catch {
          // не критично
        }
      }
    }
  };

  if (!current) return null;

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={openBox}
        className="relative grid size-10 place-items-center rounded-xl border border-navy-600 text-muted transition-colors hover:border-navy-500 hover:text-cream"
        title="Уведомления"
        aria-label="Уведомления"
      >
        <IconBell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold leading-5 text-navy-950 shadow-[0_2px_8px_rgba(255,138,0,0.5)]">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-navy-700 bg-navy-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-navy-700/70 px-4 py-3">
            <span className="text-sm font-semibold text-cream">Уведомления</span>
            {unread > 0 && (
              <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-semibold text-accent-400">
                {unread} новых
              </span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Пока пусто</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    if (n.link) router.push(n.link);
                  }}
                  className={`flex w-full items-start gap-3 border-b border-navy-800 px-4 py-3 text-left transition-colors hover:bg-navy-800/60 ${
                    n.read ? "opacity-60" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
                      n.read ? "bg-navy-800 text-muted" : "bg-accent-500/15 text-accent-400"
                    }`}
                  >
                    {typeIcon(n.type)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug text-cream">{n.message}</span>
                    <span className="mt-0.5 block text-xs text-muted">{rel(Number(n.created_at))}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

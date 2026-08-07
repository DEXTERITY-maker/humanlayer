"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowRight } from "@/components/icons";

interface Msg {
  id: string;
  taskId: string;
  fromId: string;
  toId: string;
  text: string;
  fromName: string;
  createdAt: number;
}

function rel(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return d === 1 ? "вчера" : `${d} дн назад`;
}

export default function ChatBox({
  taskId,
  userId,
  enabled,
}: {
  taskId: string;
  userId: string;
  enabled: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<number | undefined>(undefined);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
  };

  useEffect(() => {
    if (!enabled) return;
    fetchMessages();
    pollingRef.current = window.setInterval(fetchMessages, 5000);
    return () => {
      clearInterval(pollingRef.current);
    };
  }, [taskId, enabled]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      if (res.ok) {
        setText("");
        await fetchMessages();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Ошибка");
      }
    } catch {
      setError("Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  if (!enabled) return null;

  return (
    <div>
      <div className="mb-3 max-h-64 overflow-y-auto space-y-2">
        {messages.length === 0 && (
          <p className="py-4 text-center text-xs text-muted">Нет сообщений. Напишите первым.</p>
        )}
        {messages.map((m) => {
          const isMine = m.fromId === userId;
          return (
            <div key={m.id} className={"flex flex-col " + (isMine ? "items-end" : "items-start")}>
              <div className={"max-w-[80%] rounded-xl px-3 py-2 text-sm " + (isMine ? "bg-accent-500/15 text-cream" : "bg-navy-700/60 text-cream")}>
                {m.text}
              </div>
              <span className="mt-0.5 text-[11px] text-muted">
                {!isMine && m.fromName + " · "}{rel(m.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Сообщение..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="btn btn-primary shrink-0 px-3 py-2"
        >
          <IconArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

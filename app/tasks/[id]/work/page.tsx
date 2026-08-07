"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/components/AppProvider";
import { IconCheck, IconClock, IconUpload } from "@/components/icons";
import { fmt, fmtClock } from "@/lib/types";

export default function WorkPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { tasks, users, current, startWork, submitProof } = useStore();

  const task = useMemo(() => tasks.find((t) => t.id === params.id), [tasks, params.id]);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<{ name: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Восстанавливаем бегущий таймер после перезагрузки страницы
  // (одноразовое восстановление состояния — намеренно в эффекте)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (task?.timerStartedAt) {
      setStartedAt(task.timerStartedAt);
      setRunning(true);
    }
  }, [task?.timerStartedAt]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (running && startedAt) {
      timerRef.current = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, startedAt]);

  if (!task) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Задание не найдено</p>
        <Link href="/tasks" className="mt-3 inline-block text-sm font-semibold text-accent-400">
          ← К заданиям
        </Link>
      </div>
    );
  }

  const isAssigned = current?.id === task.executorId;
  if (current && !isAssigned) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Это задание назначено другому исполнителю</p>
        <Link href={`/tasks/${task.id}`} className="mt-3 inline-block text-sm font-semibold text-accent-400">
          ← Назад к заданию
        </Link>
      </div>
    );
  }

  const totalMs = (task.timerTotalMs ?? 0) + elapsed;

  const handleStart = async () => {
    await startWork(task.id);
    setStartedAt(Date.now());
    setRunning(true);
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Пожалуйста, выберите изображение (фото доказательства)");
      return;
    }
    if (f.size > 5_000_000) {
      setError("Фото слишком большое — выберите файл до 5 МБ");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setPhoto({ name: data.name, url: data.url });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!photo && !note.trim()) {
      setError("Добавьте фото или текстовый отчёт — без доказательств заказчик не примет работу");
      return;
    }
    setBusy(true);
    try {
      if (photo) {
        await submitProof(task.id, { type: "photo", name: photo.name, dataUrl: photo.url, text: note.trim() || undefined }, elapsed);
      } else {
        await submitProof(task.id, { type: "text", name: "Текстовый отчёт", text: note.trim() }, 0);
      }
      router.push(`/tasks/${task.id}`);
    } catch {
      setError("Не удалось сохранить (возможно, фото слишком большое для хранилища). Добавьте текстовый отчёт.");
    } finally {
      setBusy(false);
    }
  };

  const executor = users.find((u) => u.id === task.executorId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/tasks/${task.id}`} className="mb-4 inline-flex items-center text-sm font-semibold text-muted hover:text-accent-400">
        ← Назад к заданию
      </Link>

      <div className="card mb-5 p-6">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{task.category}</div>
        <h1 className="text-xl font-bold sm:text-2xl">{task.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{task.description}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
          <span>📍 {task.city}</span>
          <span>💰 {fmt(task.budget)}{task.hourly ? " / час" : ""}</span>
          {task.hourly && executor && <span>Ставка исполнителя: {fmt(executor.hourlyRate)}/час</span>}
        </div>
      </div>

      {task.rejectComment && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="mb-1 font-semibold text-red-300">Задание вернули на доработку:</p>
          <p className="text-red-200/80">{task.rejectComment}</p>
        </div>
      )}

      {/* TIMER */}
      {task.hourly ? (
        <div className="card mb-5 p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-muted">Таймер работы</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span className={`size-2 rounded-full ${running ? "pulse-dot bg-mint-400" : "bg-muted"}`} />
              {running ? "идёт учёт времени" : "таймер остановлен"}
            </span>
          </div>
          <div className="mb-4 text-center font-mono text-4xl font-bold tracking-wider text-accent-400 sm:text-5xl">
            {fmtClock(totalMs)}
          </div>
          {!running ? (
            <button onClick={handleStart} className="btn btn-primary w-full py-3">
              <IconClock size={18} />
              Начать выполнение
            </button>
          ) : (
            <p className="text-center text-xs text-muted">
              Таймер идёт — нажмите «Завершить» ниже, когда закончите.
            </p>
          )}
        </div>
      ) : (
        <div className="card mb-5 p-6">
          <button onClick={handleStart} className="btn btn-primary w-full py-3" disabled={running}>
            <IconClock size={18} />
            {running ? "Выполнение начато" : "Начать выполнение"}
          </button>
        </div>
      )}

      {/* PROOF */}
      <div className="card p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">
          Доказательства выполнения
        </h2>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy-600 p-6 text-center transition-colors hover:border-accent-500/60">
            <IconUpload size={22} className="text-muted" />
            <span className="text-sm font-semibold text-cream">Загрузить фото</span>
            <span className="text-xs text-muted">до 1,5 МБ</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <div>
            <label className="label">Текстовый отчёт</label>
            <textarea
              className="input min-h-[110px] resize-y"
              placeholder="Что сделано, детали, результат…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {photo && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-mint-500/30 bg-mint-500/10 p-3">
            {/* data-URL от пользователя — next/image не нужен */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={photo.name} className="h-14 w-14 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-cream">{photo.name}</p>
              <p className="text-xs text-muted">Фото добавлено к отчёту</p>
            </div>
            <button onClick={() => setPhoto(null)} className="text-sm text-muted hover:text-red-300">
              Убрать
            </button>
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <button onClick={handleSubmit} disabled={busy} className="btn btn-mint w-full py-3">
          <IconCheck size={18} />
          Завершить задание — отправить на проверку
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          После отправки заказчик проверит доказательства и примет работу — тогда оплата поступит на баланс.
        </p>
      </div>
    </div>
  );
}

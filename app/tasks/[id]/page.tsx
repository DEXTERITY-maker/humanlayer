"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/components/AppProvider";
import {
  IconBot,
  IconCheck,
  IconClock,
  IconCoins,
  IconMapPin,
  IconStar,
  IconX,
} from "@/components/icons";
import { STATUS_COLOR, STATUS_LABEL, fmt, fmtDate } from "@/lib/types";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const { tasks, users, current, applyToTask, assignExecutor, acceptWork, rejectWork } = useStore();
  const [rejectText, setRejectText] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async () => {
    if (!task) return;
    setReviewBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewText }),
      });
      if (res.ok) setReviewSent(true);
      else setError((await res.json()).error || "Ошибка");
    } catch {
      setError("Не удалось отправить отзыв");
    } finally {
      setReviewBusy(false);
    }
  };

  const task = useMemo(() => tasks.find((t) => t.id === params.id), [tasks, params.id]);
  const customer = useMemo(
    () => (task ? users.find((u) => u.id === task.customerId) : undefined),
    [task, users]
  );
  const executor = useMemo(
    () => (task?.executorId ? users.find((u) => u.id === task.executorId) : undefined),
    [task, users]
  );

  if (!task) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Задание не найдено</p>
        <Link href="/tasks" className="mt-3 inline-block text-sm font-semibold text-accent-400 hover:text-accent-300">
          ← К списку заданий
        </Link>
      </div>
    );
  }

  const isOwner = current?.id === task.customerId;
  const isExecutor = current?.id === task.executorId;
  const alreadyApplied = task.applications.some((a) => a.executorId === current?.id);
  const candidates = task.applications
    .map((a) => users.find((u) => u.id === a.executorId))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/tasks" className="mb-4 inline-flex items-center text-sm font-semibold text-muted hover:text-accent-400">
        ← Найти задание
      </Link>

      <div className="card p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="chip">{task.category}</span>
          <span className={`badge border ${STATUS_COLOR[task.status]}`}>{STATUS_LABEL[task.status]}</span>
          {task.hourly && <span className="chip chip-active">Почасовая оплата</span>}
        </div>

        <h1 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl">{task.title}</h1>
        <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-muted sm:text-base">{task.description}</p>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <IconMapPin size={16} className="text-accent-400" />
            {task.city}
            {task.location ? ` · ${task.location}` : ""}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <IconClock size={16} className="text-accent-400" />
            Срок: до {fmtDate(task.deadline)}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <IconCoins size={16} className="text-accent-400" />
            <span className="font-bold text-accent-400">
              {fmt(task.budget)}
              {task.hourly && <span className="text-xs font-medium text-muted"> / час</span>}
            </span>
            {task.hourly && task.timerTotalMs ? (
              <span className="text-xs text-muted">
                (таймер: {Math.round((task.timerTotalMs / 3600000) * 10) / 10} ч)
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <IconBot size={16} className="text-accent-400" />
            Заказчик: {customer?.name ?? "—"}
            {customer && customer.rating > 0 && (
              <span className="inline-flex items-center gap-0.5 text-accent-300">
                <IconStar size={13} /> {customer.rating}
              </span>
            )}
          </div>
        </div>

        {task.skills.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {task.skills.map((s) => (
              <span key={s} className="chip">{s}</span>
            ))}
          </div>
        )}

        {/* EXECUTOR ACTIONS */}
        {!isOwner && task.status === "open" && (
          <div className="border-t border-navy-700/70 pt-5">
            {current ? (
              current.role === "executor" ? (
                alreadyApplied ? (
                  <p className="inline-flex items-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 px-4 py-2.5 text-sm font-semibold text-accent-300">
                    <IconCheck size={16} /> Отклик отправлен, ждём подтверждения заказчика
                  </p>
                ) : (
                  <button onClick={async () => { await applyToTask(task.id); }} className="btn btn-primary px-6 py-3">
                    Откликнуться
                  </button>
                )
              ) : (
                <p className="text-sm text-muted">
                  Вы вошли как заказчик — для отклика нужен аккаунт исполнителя.
                </p>
              )
            ) : (
              <Link href="/login" className="btn btn-primary px-6 py-3">
                Войдите, чтобы откликнуться
              </Link>
            )}
          </div>
        )}

        {!isOwner && task.status === "pending" && alreadyApplied && (
          <div className="border-t border-navy-700/70 pt-5">
            <p className="inline-flex items-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 px-4 py-2.5 text-sm font-semibold text-accent-300">
              <IconClock size={16} /> Ваш отклик на рассмотрении
            </p>
          </div>
        )}

        {isExecutor && (task.status === "in_progress" || task.status === "review") && (
          <div className="border-t border-navy-700/70 pt-5">
            <Link href={`/tasks/${task.id}/work`} className="btn btn-mint px-6 py-3">
              {task.status === "in_progress" ? "К выполнению задания →" : "К отчёту о выполнении →"}
            </Link>
            {task.rejectComment && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
                <p className="mb-1 font-semibold text-red-300">Заказчик вернул задание на доработку:</p>
                <p className="text-red-200/80">{task.rejectComment}</p>
              </div>
            )}
          </div>
        )}

        {/* OWNER ACTIONS */}
        {isOwner && (
          <div className="border-t border-navy-700/70 pt-5">
            {task.status === "pending" && candidates.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
                  Кандидаты ({candidates.length}) — система подобрала по навыкам и локации
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {candidates.map((c) => (
                    <div key={c.id} className="rounded-xl border border-navy-700 bg-navy-900 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold">{c.name}</span>
                        <span className="inline-flex items-center gap-1 text-sm text-accent-300">
                          <IconStar size={13} /> {c.rating > 0 ? c.rating : "новый"}
                        </span>
                      </div>
                      <div className="mb-1 text-xs text-muted">
                        {c.city} · {fmt(c.hourlyRate)}/час
                      </div>
                      <div className="mb-3 flex flex-wrap gap-1">
                        {c.skills.slice(0, 4).map((s) => (
                          <span key={s} className="rounded-md bg-navy-700/60 px-1.5 py-0.5 text-[11px] text-muted">{s}</span>
                        ))}
                      </div>
                      <button onClick={async () => { await assignExecutor(task.id, c.id); }} className="btn btn-mint btn-sm w-full">
                        Назначить исполнителем
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {task.status === "pending" && candidates.length === 0 && (
              <p className="text-sm text-muted">Откликов пока нет — задание ждёт исполнителей.</p>
            )}

            {task.status === "in_progress" && executor && (
              <p className="text-sm text-muted">
                В работе: <b className="text-cream">{executor.name}</b>. Средства заблокированы на эскроу
                до приёмки работы.
              </p>
            )}

            {task.status === "review" && (
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
                  Доказательства выполнения
                </h3>
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  {task.proofs.map((p) => (
                    <div key={p.id} className="rounded-xl border border-navy-700 bg-navy-900 p-3">
                      {p.type === "text" ? (
                        <p className="text-sm text-cream">{p.text}</p>
                      ) : p.dataUrl ? (
                        // data-URL пользователя (фото доказательства) — next/image не нужен
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.dataUrl} alt={p.name} className="mb-2 max-h-48 w-full rounded-lg object-cover" />
                      ) : null}
                      {p.text && (
                        <p className="mb-2 text-sm text-cream">{p.text}</p>
                      )}
                      <p className="mt-1 text-xs text-muted">
                        {p.name} · {new Date(p.at).toLocaleString("ru-RU")}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={async () => { await acceptWork(task.id); }} className="btn btn-mint">
                    <IconCheck size={16} />
                    Принять работу, перевести оплату
                  </button>
                  <button onClick={() => setShowReject((v) => !v)} className="btn btn-danger">
                    <IconX size={16} />
                    Отклонить
                  </button>
                </div>
                {showReject && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      className="input"
                      placeholder="Комментарий для исполнителя…"
                      value={rejectText}
                      onChange={(e) => setRejectText(e.target.value)}
                    />
                    <button
                      onClick={async () => {
                        await rejectWork(task.id, rejectText.trim() || "Работа не принята, доработайте");
                        setShowReject(false);
                        setRejectText("");
                      }}
                      className="btn btn-danger"
                    >
                      Отправить на доработку
                    </button>
                  </div>
                )}
              </div>
            )}

            {task.status === "done" && (
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 rounded-xl border border-mint-500/30 bg-mint-500/10 px-4 py-2.5 text-sm font-semibold text-mint-300">
                  <IconCheck size={16} /> Задание выполнено{executor ? ` · ${executor.name}` : ""}. Комиссия платформы 5% удержана.
                </p>
                {(isOwner || isExecutor) && !reviewSent && (
                  <div className="rounded-xl border border-navy-700 bg-navy-800/40 p-4">
                    <p className="mb-3 text-sm font-semibold">Оставить отзыв</p>
                    <div className="mb-3 flex items-center gap-1">
                      {[1,2,3,4,5].map((n) => (
                        <button key={n} onClick={() => setReviewRating(n)}
                          className={`grid size-8 place-items-center rounded-lg text-sm font-bold transition-colors ${
                            n <= reviewRating ? "bg-accent-500 text-navy-950" : "bg-navy-700 text-muted"
                          }`}
                        >{n}</button>
                      ))}
                    </div>
                    <input className="input mb-3 w-full" placeholder="Комментарий (необязательно)" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                    {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
                    <button onClick={handleReview} disabled={reviewBusy} className="btn btn-primary text-sm">
                      {reviewBusy ? "Отправка…" : "Отправить отзыв"}
                    </button>
                  </div>
                )}
                {reviewSent && (
                  <p className="text-sm text-mint-300">✅ Отзыв отправлен. Спасибо!</p>
                )}
              </div>
            )}
          </div>
        )}

        {!current && (task.status === "in_progress" || task.status === "review") && (
          <div className="border-t border-navy-700/70 pt-5 text-sm text-muted">
            Войдите, чтобы отслеживать выполнение задания.
          </div>
        )}
      </div>
    </div>
  );
}

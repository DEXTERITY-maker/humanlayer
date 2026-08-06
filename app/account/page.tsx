"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/components/AppProvider";
import {
  IconArrowRight,
  IconBriefcase,
  IconPlus,
  IconStar,
  IconUser,
  IconWallet,
} from "@/components/icons";
import { CATEGORIES, CITIES, SKILLS, STATUS_COLOR, STATUS_LABEL, fmt, fmtDate } from "@/lib/types";

type Tab = "overview" | "create" | "history";

export default function AccountPage() {
  const router = useRouter();
  const {
    current,
    ready,
    users,
    tasks,
    updateProfile,
    addCredits,
    createTask,
    assignExecutor,
    acceptWork,
  } = useStore();

  const [tab, setTab] = useState<Tab>("overview");
  const [msg, setMsg] = useState<string | null>(null);

  // профиль-форма
  const [name, setName] = useState(current?.name ?? "");
  const [city, setCity] = useState(current?.city ?? CITIES[0]);
  const [phone, setPhone] = useState(current?.phone ?? "");
  const [telegram, setTelegram] = useState(current?.telegram ?? "");
  const [skills, setSkills] = useState<string[]>(current?.skills ?? []);
  const [hourlyRate, setHourlyRate] = useState(current?.hourlyRate ?? 1000);

  // форма создания задания
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fCat, setFCat] = useState<string>(CATEGORIES[0]);
  const [fCity, setFCity] = useState<string>(CITIES[0]);
  const [fLoc, setFLoc] = useState("");
  const [fDeadline, setFDeadline] = useState("");
  const [fBudget, setFBudget] = useState(3000);
  const [fHourly, setFHourly] = useState(false);
  const [fSkills, setFSkills] = useState<string[]>([]);
  const [fErr, setFErr] = useState<string | null>(null);

  if (ready && !current) {
    router.replace("/login");
    return null;
  }
  if (!current) return null;

  const isCustomer = current.role === "customer";

  const myTasks = tasks.filter(
    (t) => (isCustomer ? t.customerId === current.id : t.executorId === current.id)
  );
  const active = myTasks.filter((t) => ["pending", "in_progress", "review"].includes(t.status));
  const history = myTasks.filter((t) => ["done", "rejected"].includes(t.status));
  const myApplications = tasks.filter((t) =>
    !isCustomer && t.applications.some((a) => a.executorId === current.id) && t.status === "pending"
  );

  const toggleSkill = (s: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(s) ? list.filter((x) => x !== s) : [...list, s]);

  const saveProfile = async () => {
    const err = await updateProfile({
      name: name.trim() || current.name,
      city,
      phone,
      telegram,
      skills,
      hourlyRate,
    });
    setMsg(err ?? "Профиль сохранён");
    setTimeout(() => setMsg(null), 2500);
  };

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = await createTask({
      title: fTitle,
      description: fDesc,
      category: fCat,
      city: fCity,
      location: fLoc,
      deadline: fDeadline || "2026-12-31",
      budget: fBudget,
      hourly: fHourly,
      skills: fSkills,
    });
    if (err) return setFErr(err);
    setFTitle("");
    setFDesc("");
    setFLoc("");
    setFErr(null);
    setMsg("Задание опубликовано! Средства заблокированы на эскроу.");
    setTimeout(() => setMsg(null), 3500);
    setTab("overview");
  };

  const tabs: { id: Tab; label: string; icon: typeof IconUser }[] = [
    { id: "overview", label: isCustomer ? "Мои задания" : "Профиль и задания", icon: IconUser },
    ...(isCustomer ? [{ id: "create" as Tab, label: "Создать задание", icon: IconPlus }] : []),
    { id: "history", label: "История", icon: IconBriefcase },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-navy-600 to-navy-700 text-2xl font-bold text-accent-400">
            {current.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">{current.name}</h1>
            <p className="text-sm text-muted">
              {isCustomer ? "Заказчик · владелец ИИ-агента" : `Исполнитель · ${current.city}`}
              {current.rating > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-accent-300">
                  <IconStar size={13} /> {current.rating} ({current.reviews})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="card flex items-center gap-3 px-4 py-2.5">
            <IconWallet size={18} className="text-mint-400" />
            <div>
              <div className="text-xs text-muted">Баланс (эскроу)</div>
              <div className="font-bold text-mint-300">{fmt(current.balance)}</div>
            </div>
            <button
              onClick={async () => {
                const err = await addCredits(1000);
                setMsg(err ?? "+1 000 кредитов начислено");
                setTimeout(() => setMsg(null), 2500);
              }}
              className="ml-1 rounded-lg border border-mint-500/40 px-2.5 py-1 text-xs font-semibold text-mint-300 hover:bg-mint-500/10"
              title="Пополнить тестовый баланс"
            >
              +1000
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-mint-500/30 bg-mint-500/10 px-4 py-2.5 text-sm font-semibold text-mint-300">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-navy-900 p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-accent-500 text-navy-950" : "text-muted hover:text-cream"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ EXECUTOR PROFILE + OVERVIEW ============ */}
      {tab === "overview" && !isCustomer && (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Profile */}
          <div className="card p-6 lg:col-span-2">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">Профиль</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Имя</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Город</label>
                  <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Ставка, кр./час</label>
                  <input className="input" type="number" min={0} step={100} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Телефон</label>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 …" />
                </div>
                <div>
                  <label className="label">Telegram</label>
                  <input className="input" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@nick" />
                </div>
              </div>
              <div>
                <label className="label">Навыки</label>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleSkill(s, skills, setSkills)} className={`chip ${skills.includes(s) ? "chip-active" : ""}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveProfile} className="btn btn-primary w-full">Сохранить профиль</button>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-5 lg:col-span-3">
            {myApplications.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
                  Мои отклики ({myApplications.length})
                </h2>
                <div className="space-y-2.5">
                  {myApplications.map((t) => (
                    <Link key={t.id} href={`/tasks/${t.id}`} className="card flex items-center justify-between gap-3 p-4 transition-colors hover:border-accent-500/50">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{t.title}</p>
                        <p className="text-xs text-muted">{t.city} · {fmt(t.budget)}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-accent-300">На рассмотрении →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
                Активные задания ({active.length})
              </h2>
              {active.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-sm text-muted">Пока нет активных заданий.</p>
                  <Link href="/tasks" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent-400 hover:text-accent-300">
                    Найти задание <IconArrowRight size={15} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {active.map((t) => (
                    <div key={t.id} className="card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/tasks/${t.id}`} className="font-semibold hover:text-accent-400">
                            {t.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted">
                            {t.city} · {fmt(t.budget)}{t.hourly ? "/час" : ""} · до {fmtDate(t.deadline)}
                          </p>
                        </div>
                        <span className={`badge shrink-0 border ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                      </div>
                      {(t.status === "in_progress" || t.status === "review") && (
                        <Link href={`/tasks/${t.id}/work`} className="btn btn-mint btn-sm mt-3">
                          {t.status === "in_progress" ? "К выполнению →" : "К отчёту →"}
                        </Link>
                      )}
                      {t.status === "review" && (
                        <p className="mt-2 text-xs text-muted">
                          Доказательства отправлены — ждём приёмки заказчика
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ CUSTOMER OVERVIEW ============ */}
      {tab === "overview" && isCustomer && (
        <div className="space-y-5">
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
                Активные задания ({active.length})
              </h2>
              <button onClick={() => setTab("create")} className="btn btn-primary btn-sm">
                <IconPlus size={14} /> Новое задание
              </button>
            </div>
            {active.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Нет активных заданий. Создайте первое — ИИ-агенты ждут исполнителей.
              </p>
            ) : (
              <div className="space-y-3">
                {active.map((t) => {
                  const candidates = t.applications
                    .map((a) => users.find((u) => u.id === a.executorId))
                    .filter((u): u is NonNullable<typeof u> => Boolean(u));
                  return (
                    <div key={t.id} className="rounded-xl border border-navy-700 bg-navy-900 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/tasks/${t.id}`} className="font-semibold hover:text-accent-400">{t.title}</Link>
                          <p className="mt-0.5 text-xs text-muted">
                            {t.city} · {fmt(t.budget)} · до {fmtDate(t.deadline)}
                          </p>
                        </div>
                        <span className={`badge border ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                      </div>

                      {t.status === "pending" && candidates.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 text-xs font-semibold text-muted">Кандидаты:</p>
                          <div className="flex flex-wrap gap-2">
                            {candidates.map((c) => (
                              <div key={c.id} className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2">
                                <div>
                                  <p className="text-xs font-semibold">{c.name}</p>
                                  <p className="text-[11px] text-muted">
                                    {c.city} · {c.rating > 0 ? `★ ${c.rating}` : "новый"} · {fmt(c.hourlyRate)}/час
                                  </p>
                                </div>
                                <button
                                  onClick={async () => {
                                    await assignExecutor(t.id, c.id);
                                  }}
                                  className="rounded-lg bg-mint-500 px-2.5 py-1 text-xs font-bold text-navy-950 hover:bg-mint-400"
                                >
                                  Назначить
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {t.status === "pending" && candidates.length === 0 && (
                        <p className="mt-3 text-xs text-muted">Откликов пока нет.</p>
                      )}
                      {t.status === "review" && (
                        <div className="mt-3 flex items-center gap-3">
                          <Link href={`/tasks/${t.id}`} className="btn btn-mint btn-sm">
                            Проверить доказательства
                          </Link>
                          <button
                            onClick={async () => {
                              await acceptWork(t.id);
                            }}
                            className="btn btn-ghost btn-sm"
                            title="Быстро принять работу"
                          >
                            Принять работу
                          </button>
                        </div>
                      )}
                      {t.status === "in_progress" && t.executorId && (
                        <p className="mt-3 text-xs text-muted">
                          Исполнитель: <b className="text-cream">{users.find((u) => u.id === t.executorId)?.name}</b> — средства на эскроу
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ CREATE TASK ============ */}
      {tab === "create" && isCustomer && (
        <form onSubmit={submitTask} className="card max-w-2xl space-y-5 p-6">
          <h2 className="text-lg font-bold">Новое задание</h2>
          <div>
            <label className="label">Название</label>
            <input className="input" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Например: Доставить документы в офис" />
          </div>
          <div>
            <label className="label">Описание</label>
            <textarea className="input min-h-[110px] resize-y" value={fDesc} onChange={(e) => setFDesc(e.target.value)} placeholder="Что нужно сделать, детали, условия…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Категория</label>
              <select className="input" value={fCat} onChange={(e) => setFCat(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Город</label>
              <select className="input" value={fCity} onChange={(e) => setFCity(e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Адрес / локация</label>
              <input className="input" value={fLoc} onChange={(e) => setFLoc(e.target.value)} placeholder="Улица, ориентиры" />
            </div>
            <div>
              <label className="label">Срок выполнения</label>
              <input className="input" type="date" value={fDeadline} onChange={(e) => setFDeadline(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Вознаграждение, кр.</label>
              <input className="input" type="number" min={100} step={100} value={fBudget} onChange={(e) => setFBudget(Number(e.target.value))} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-navy-600 bg-navy-900 px-4 py-2.5 text-sm">
                <input type="checkbox" checked={fHourly} onChange={(e) => setFHourly(e.target.checked)} className="size-4 accent-[#ff8a00]" />
                Почасовая оплата (таймер)
              </label>
            </div>
          </div>
          <div>
            <label className="label">Требуемые навыки</label>
            <div className="flex flex-wrap gap-1.5">
              {SKILLS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSkill(s, fSkills, setFSkills)} className={`chip ${fSkills.includes(s) ? "chip-active" : ""}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {fErr && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{fErr}</p>}
          <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-4 text-sm">
            <p className="font-semibold text-accent-300">Эскроу</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {fmt(fBudget)} будет заморожено на вашем балансе до приёмки работы. После подтверждения
              исполнитель получит сумму за вычетом комиссии 5%, остальное вернётся вам.
            </p>
          </div>
          <button type="submit" className="btn btn-primary w-full py-3">
            <IconPlus size={18} />
            Опубликовать задание
          </button>
        </form>
      )}

      {/* ============ HISTORY ============ */}
      {tab === "history" && (
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">
            История ({history.length})
          </h2>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">История пуста — пока нет завершённых заданий.</p>
          ) : (
            <div className="space-y-2.5">
              {history.map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-navy-700 bg-navy-900 p-4 transition-colors hover:border-accent-500/40">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.title}</p>
                    <p className="text-xs text-muted">
                      {fmt(t.budget)} · {t.status === "done" ? "выполнено" : "отклонено"}
                      {t.status === "done" && t.executorId
                        ? ` · ${users.find((u) => u.id === t.executorId)?.name ?? ""}`
                        : t.rejectComment
                          ? ` · причина: ${t.rejectComment}`
                          : ""}
                    </p>
                  </div>
                  <span className={`badge shrink-0 border ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

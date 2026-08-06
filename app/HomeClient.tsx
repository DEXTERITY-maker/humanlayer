"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import { useStore } from "@/components/AppProvider";
import { CardSkeleton } from "@/components/Skeleton";
import TaskCard from "@/components/TaskCard";
import HomeTasks from "@/app/HomeTasks";
import {
  IconArrowRight,
  IconBot,
  IconSearch,
  IconShield,
  IconSparkles,
  IconStar,
  IconZap,
} from "@/components/icons";
import { CATEGORIES, CITIES, fmt } from "@/lib/types";

const BENEFITS = [
  {
    icon: IconShield,
    title: "Безопасные сделки",
    text: "Средства блокируются на эскроу-счёте до подтверждения выполнения. Никто не останется без оплаты.",
    color: "text-mint-400 bg-mint-500/10 border-mint-500/30",
  },
  {
    icon: IconStar,
    title: "Рейтинг исполнителей",
    text: "После каждой сделки обе стороны оценивают друг друга. Честная история — лучший выбор кандидатов.",
    color: "text-accent-400 bg-accent-500/10 border-accent-500/30",
  },
  {
    icon: IconZap,
    title: "Прозрачная оплата",
    text: "Фиксированная цена или почасовая ставка с таймером. Комиссия платформы — всего 5%.",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  },
];

const STEPS = [
  { n: "01", title: "Регистрация", text: "Укажи навыки, город и ставку — за 2 минуты." },
  { n: "02", title: "ИИ публикует задание", text: "Агент описывает задачу, локацию и вознаграждение." },
  { n: "03", title: "Система подбирает тебя", text: "Автоматический подбор по навыкам и расстоянию." },
  { n: "04", title: "Выполни и получи оплату", text: "Загрузи доказательство — деньги придут на баланс." },
];

export default function Home() {
  const router = useRouter();
  const { tasks, current } = useStore();
  const [city, setCity] = useState("");
  const [cat, setCat] = useState("");

  const examples = useMemo(
    () => tasks.filter((t) => t.status === "open").slice(0, 3),
    [tasks]
  );

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done").length;
    const avg = done > 0 ? Math.round(tasks.reduce((s, t) => s + t.budget, 0) / done) : 0;
    return [
      { v: String(2480 + done * 3), l: "заданий выполнено" },
      { v: "1 200+", l: "исполнителей" },
      { v: fmt(avg || 3400), l: "средний чек" },
    ];
  }, [tasks]);

  const goSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (city) q.set("city", city);
    if (cat) q.set("cat", cat);
    router.push(`/tasks${q.toString() ? `?${q}` : ""}`);
  };

  return (
    <div className="hero-glow">
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center sm:pt-24">
        <span className="fade-up inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-xs font-semibold text-accent-300">
          <IconSparkles size={14} />
          Платформа, где ИИ-агенты нанимают людей
        </span>
        <h1 className="fade-up mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl" style={{ animationDelay: "0.08s" }}>
          ИИ нуждается{" "}
          <span className="bg-gradient-to-r from-accent-400 to-accent-600 bg-clip-text text-transparent">
            в твоих руках
          </span>
        </h1>
        <p className="fade-up mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg" style={{ animationDelay: "0.16s" }}>
          Регистрируйся и получай задания от умных машин: доставка, фото, перевод,
          ремонт и многое другое. Оплата — на эскроу, рейтинг — честный.
        </p>
        <div className="fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.24s" }}>
          <Link href="/tasks" className="btn btn-primary w-full px-8 py-3 text-base sm:w-auto">
            <IconSearch size={18} />
            Найти задание
          </Link>
          <Link
            href={current?.role === "customer" ? "/account" : "/register?role=customer"}
            className="btn btn-ghost w-full px-8 py-3 text-base sm:w-auto"
          >
            <IconBot size={18} />
            Создать задание
          </Link>
        </div>

        {/* Search */}
        <form
          onSubmit={goSearch}
          className="fade-up mx-auto mt-10 flex max-w-2xl flex-col gap-2 rounded-2xl border border-navy-700 bg-navy-800/70 p-2.5 backdrop-blur sm:flex-row"
          style={{ animationDelay: "0.32s" }}
        >
          <select value={city} onChange={(e) => setCity(e.target.value)} className="input sm:flex-1">
            <option value="">Любой город</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="input sm:flex-1">
            <option value="">Любая категория</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            <IconSearch size={16} />
            Искать
          </button>
        </form>

        {/* Stats */}
        <div className="fade-up mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-2 sm:gap-4" style={{ animationDelay: "0.4s" }}>
          {stats.map((s) => (
            <div key={s.l} className="card px-1.5 py-3 sm:px-2 sm:py-4">
              <div className="text-lg font-extrabold text-accent-400 sm:text-2xl">{s.v}</div>
              <div className="mt-1 text-[10px] text-muted sm:text-xs">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* EXAMPLES */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Свежие задания</h2>
            <p className="mt-1 text-sm text-muted">ИИ-агенты уже ждут исполнителей</p>
          </div>
          <Link href="/tasks" className="hidden items-center gap-1 text-sm font-semibold text-accent-400 hover:text-accent-300 sm:inline-flex">
            Все задания <IconArrowRight size={16} />
          </Link>
        </div>
        <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
          <HomeTasks />
        </Suspense>
        <Link href="/tasks" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent-400 hover:text-accent-300 sm:hidden">
          Все задания <IconArrowRight size={16} />
        </Link>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">Почему HumanLayer</h2>
        <p className="mb-8 text-center text-sm text-muted">Работа с ИИ — это просто и безопасно</p>
        <div className="grid gap-4 md:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="card p-6">
              <span className={`mb-4 grid size-11 place-items-center rounded-xl border ${b.color}`}>
                <b.icon size={22} />
              </span>
              <h3 className="mb-2 font-bold">{b.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">Как это работает</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="card relative p-6">
              <span className="absolute top-5 right-5 text-3xl font-extrabold text-navy-600">{s.n}</span>
              <span className="mb-3 grid size-8 place-items-center rounded-lg bg-accent-500/15 text-sm font-bold text-accent-400">
                {i + 1}
              </span>
              <h3 className="mb-1.5 font-bold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="card relative overflow-hidden p-8 text-center sm:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-transparent to-mint-500/10" />
          <div className="relative">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Готов принять первое задание от ИИ?</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted sm:text-base">
              Регистрация занимает две минуты. Новым исполнителям — приветственный бонус 1 000 кредитов на баланс.
            </p>
            <Link href="/register" className="btn btn-primary mt-6 px-8 py-3 text-base">
              Зарегистрироваться бесплатно
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/components/AppProvider";
import TaskCard from "@/components/TaskCard";
import { IconSearch } from "@/components/icons";
import { CATEGORIES, CITIES } from "@/lib/types";

const readQuery = (key: string) =>
  typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get(key) ?? "";

export default function TasksPage() {
  const { tasks, ready } = useStore();
  const [q, setQ] = useState("");
  // параметры с главной страницы (город/категория) читаются один раз при монтировании
  const [city, setCity] = useState(() => readQuery("city"));
  const [cat, setCat] = useState(() => readQuery("cat"));
  const [maxBudget, setMaxBudget] = useState("");
  const [sort, setSort] = useState<"new" | "budget">("new");

  const filtered = useMemo(() => {
    let list = tasks.filter((t) => t.status === "open" || t.status === "pending");
    const text = q.trim().toLowerCase();
    if (text) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(text) ||
          t.description.toLowerCase().includes(text) ||
          t.skills.some((s) => s.toLowerCase().includes(text))
      );
    }
    if (city) list = list.filter((t) => t.city === city);
    if (cat) list = list.filter((t) => t.category === cat);
    if (maxBudget) list = list.filter((t) => t.budget <= Number(maxBudget));
    list = [...list].sort((a, b) =>
      sort === "new" ? b.createdAt - a.createdAt : b.budget - a.budget
    );
    return list;
  }, [tasks, q, city, cat, maxBudget, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Найти задание</h1>
        <p className="mt-1 text-sm text-muted">
          {ready ? `${filtered.length} заданий` : "Загрузка…"} от ИИ-агентов рядом с тобой
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <IconSearch size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
          <input
            className="input pl-10"
            placeholder="Поиск: доставка, фото, перевод…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Любой город</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Любая категория</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input"
            type="number"
            min={0}
            placeholder="До, кр."
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as "new" | "budget")}>
            <option value="new">Сначала новые</option>
            <option value="budget">По цене</option>
          </select>
        </div>
      </div>

      {(q || city || cat || maxBudget) && (
        <button
          onClick={() => {
            setQ("");
            setCity("");
            setCat("");
            setMaxBudget("");
          }}
          className="mb-4 text-xs font-semibold text-accent-400 hover:text-accent-300"
        >
          ✕ Сбросить фильтры
        </button>
      )}

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-lg font-semibold">Ничего не найдено</p>
          <p className="mt-1 text-sm text-muted">Попробуй сбросить фильтры или загляни позже</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}

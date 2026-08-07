"use client";

import { useCallback, useEffect, useState } from "react";
import TaskCard from "@/components/TaskCard";
import { CardSkeleton } from "@/components/Skeleton";
import { IconSearch } from "@/components/icons";
import type { Task } from "@/lib/types";
import { CATEGORIES, CITIES } from "@/lib/types";
import { j } from "@/lib/api";

interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

export default function TasksPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [cat, setCat] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sort, setSort] = useState<"new" | "budget">("new");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 12;

  const fetchTasks = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (city) params.set("city", city);
      if (cat) params.set("category", cat);
      if (maxBudget) params.set("maxBudget", maxBudget);
      params.set("sort", sort);
      params.set("page", String(pageNum));
      params.set("limit", String(limit));
      params.set("status", "open");

      try {
        const data = await j<TasksResponse>(`/api/tasks?${params.toString()}`);
        if (append) {
          setTasks((prev) => [...prev, ...data.tasks]);
        } else {
          setTasks(data.tasks);
        }
        setTotal(data.total);
        setPage(pageNum);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
        if (!append) setTasks([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [q, city, cat, maxBudget, sort]
  );

  // Initial load
  useEffect(() => {
    fetchTasks(1, false);
  }, []); // only on mount

  // Reload when filters change
  useEffect(() => {
    fetchTasks(1, false);
  }, [q, city, cat, maxBudget, sort]);

  const resetFilters = () => {
    setQ("");
    setCity("");
    setCat("");
    setMaxBudget("");
    setSort("new");
  };

  const hasFilters = q || city || cat || maxBudget;
  const hasMore = tasks.length < total && !loading;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Найти задание</h1>
        <p className="mt-1 text-sm text-muted">
          {loading ? "Загрузка…" : `${total} заданий`} от ИИ-агентов рядом с тобой
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
          {CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Любая категория</option>
          {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" type="number" min={0} placeholder="До, кр." value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as "new" | "budget")}>
            <option value="new">Сначала новые</option>
            <option value="budget">По цене</option>
          </select>
        </div>
      </div>

      {hasFilters && (
        <button onClick={resetFilters} className="mb-4 text-xs font-semibold text-accent-400 hover:text-accent-300">
          ✕ Сбросить фильтры
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="card mb-4 border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
          <button onClick={() => fetchTasks(1, false)} className="ml-3 underline">Повторить</button>
        </div>
      )}

      {/* States */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (<CardSkeleton key={i} />))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-lg font-semibold">Ничего не найдено</p>
          <p className="mt-1 text-sm text-muted">Попробуй сбросить фильтры или загляни позже</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => (<TaskCard key={t.id} task={t} />))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button onClick={() => fetchTasks(page + 1, true)} disabled={loadingMore} className="btn btn-secondary">
                {loadingMore ? "Загрузка…" : `Загрузить ещё (${total - tasks.length} из ${total})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

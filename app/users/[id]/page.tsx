"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IconStar } from "@/components/icons";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: number;
  fromName: string;
  fromId: string;
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    role: string;
    city: string;
    skills: string[];
    hourlyRate: number;
    rating: number;
    reviews: number;
    createdAt: number;
  };
  reviews: Review[];
  stats: { totalTasks: number; avgRating: number; totalReviews: number };
}

function ratingColor(r: number) {
  if (r >= 4) return "text-mint-300";
  if (r >= 3) return "text-accent-300";
  return "text-red-300";
}

function roleLabel(role: string) {
  return role === "executor" ? "Исполнитель" : "Заказчик";
}

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/users/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Пользователь не найден" : "Ошибка загрузки");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-red-300">{error || "Не найдено"}</p>
        <Link href="/tasks" className="mt-3 inline-block text-sm font-semibold text-accent-400 hover:text-accent-300">
          ← К списку заданий
        </Link>
      </div>
    );
  }

  const { user, reviews, stats } = data;
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card mb-6 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-2xl font-bold text-accent-400">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted">{user.city}{" · "}{roleLabel(user.role)}</p>
            {user.rating > 0 && (
              <p className="mt-1 inline-flex items-center gap-1 text-sm">
                <IconStar size={15} className={ratingColor(user.rating)} />
                <span className={ratingColor(user.rating)}>{user.rating}</span>
                <span className="text-muted">({user.reviews} отзывов)</span>
              </p>
            )}
          </div>
        </div>
        {user.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {user.skills.map((s) => (
              <span key={s} className="chip">{s}</span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-cream">{stats.totalTasks}</p>
          <p className="text-xs text-muted">Выполнено заданий</p>
        </div>
        <div className="card p-4 text-center">
          <p className={"text-2xl font-bold " + ratingColor(stats.avgRating)}>
            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-muted">Средний рейтинг</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-cream">{stats.totalReviews}</p>
          <p className="text-xs text-muted">Отзывов</p>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-bold">Отзывы</h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted">Отзывов пока нет.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <Link href={`/users/${r.fromId}`} className="text-sm font-semibold hover:text-accent-400">
                  {r.fromName}
                </Link>
                <span className={"inline-flex items-center gap-0.5 text-sm " + ratingColor(r.rating)}>
                  <IconStar size={13} />
                  {r.rating}
                </span>
              </div>
              {r.comment && <p className="text-sm text-cream/80">{r.comment}</p>}
              <p className="mt-1 text-xs text-muted">
                {new Date(r.createdAt).toLocaleDateString("ru-RU")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

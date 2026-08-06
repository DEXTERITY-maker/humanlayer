"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/components/AppProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, current } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (current) {
    router.replace("/account");
    return null;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = login(email, password);
    if (err) return setError(err);
    router.push("/account");
  };

  const fill = (em: string) => {
    setEmail(em);
    setPassword("demo");
    setError(null);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Вход</h1>
        <p className="mt-2 text-sm text-muted">Рады видеть тебя снова</p>
      </div>

      <form onSubmit={submit} className="card space-y-5 p-6">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Пароль</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <button type="submit" className="btn btn-primary w-full py-3">
          Войти
        </button>

        <p className="text-center text-sm text-muted">
          Нет аккаунта?{" "}
          <Link href="/register" className="font-semibold text-accent-400 hover:text-accent-300">
            Зарегистрироваться
          </Link>
        </p>
      </form>

      <div className="mt-4 rounded-xl border border-navy-700 bg-navy-900/60 p-4 text-xs leading-relaxed text-muted">
        <b className="text-cream">Демо-вход в один клик:</b>
        <div className="mt-2 flex flex-col gap-1.5">
          <button onClick={() => fill("anna@demo.hl")} className="text-left text-accent-300 hover:underline">
            Исполнитель — anna@demo.hl (фото, съёмка)
          </button>
          <button onClick={() => fill("agent@demo.hl")} className="text-left text-accent-300 hover:underline">
            Заказчик ИИ-агент — agent@demo.hl (создание заданий)
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useStore } from "@/components/AppProvider";
import { IconBot, IconUser } from "@/components/icons";
import { CITIES, SKILLS, fmt } from "@/lib/types";
import type { Role } from "@/lib/types";

function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const { register, current } = useStore();

  const [role, setRole] = useState<Role>(sp.get("role") === "customer" ? "customer" : "executor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState<string>(CITIES[0]);
  const [skills, setSkills] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState(1000);
  const [error, setError] = useState<string | null>(null);

  if (current) {
    router.replace("/account");
    return null;
  }

  const toggleSkill = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = await register({ name, email, password, role, city, skills, hourlyRate });
    if (err) return setError(err);
    router.push("/account");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Создать аккаунт</h1>
        <p className="mt-2 text-sm text-muted">
          {role === "executor"
            ? `Новым исполнителям — ${fmt(1000)} на баланс`
            : `Новым заказчикам — ${fmt(2000)} для эскроу`}
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-5 p-6">
        {/* Role toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-navy-900 p-1.5">
          {(
            [
              { r: "executor" as Role, label: "Исполнитель", icon: IconUser },
              { r: "customer" as Role, label: "Заказчик (ИИ)", icon: IconBot },
            ]
          ).map((o) => (
            <button
              key={o.r}
              type="button"
              onClick={() => setRole(o.r)}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                role === o.r ? "bg-accent-500 text-navy-950" : "text-muted hover:text-cream"
              }`}
            >
              <o.icon size={16} />
              {o.label}
            </button>
          ))}
        </div>

        <div>
          <label className="label">Имя</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Иван Петров" />
        </div>

        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>

        <div>
          <label className="label">Пароль</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        <div>
          <label className="label">Город</label>
          <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {role === "executor" && (
          <>
            <div>
              <label className="label">Навыки (выбери свои)</label>
              <div className="flex flex-wrap gap-1.5">
                {SKILLS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSkill(s)}
                    className={`chip transition-colors ${skills.includes(s) ? "chip-active" : "hover:border-navy-600"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Почасовая ставка, кр.</label>
              <input
                className="input"
                type="number"
                min={0}
                step={100}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
              />
            </div>
          </>
        )}

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <button type="submit" className="btn btn-primary w-full py-3">
          Создать аккаунт
        </button>

        <p className="text-center text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-semibold text-accent-400 hover:text-accent-300">
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

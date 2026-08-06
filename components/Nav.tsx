"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/components/AppProvider";
import { IconBot, IconCoins, IconLogout, IconPlus, IconUser } from "@/components/icons";
import { fmt } from "@/lib/types";

export default function Nav() {
  const { current, logout, ready } = useStore();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const link = (href: string, label: string) => {
    const active = path === href || (href !== "/" && path.startsWith(href));
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          active ? "bg-navy-700 text-accent-400" : "text-muted hover:text-cream hover:bg-navy-800"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-navy-700/70 bg-navy-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 text-navy-950 shadow-[0_4px_16px_rgba(255,138,0,0.35)]">
            <IconBot size={20} />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Human<span className="text-accent-500">Layer</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {link("/tasks", "Найти задание")}
          {current?.role === "customer" && link("/account", "Создать задание")}
          {current && link("/account", "Кабинет")}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {ready && current ? (
            <>
              <span
                className="flex items-center gap-1.5 rounded-xl border border-mint-500/30 bg-mint-500/10 px-3 py-1.5 text-sm font-semibold text-mint-300"
                title="Тестовый баланс (кредиты)"
              >
                <IconCoins size={15} />
                {fmt(current.balance)}
              </span>
              <Link href="/account" className="btn btn-ghost btn-sm">
                <IconUser size={14} />
                {current.name.split(" ")[0]}
              </Link>
              <button onClick={logout} className="btn btn-ghost btn-sm" title="Выйти">
                <IconLogout size={14} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Войти
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                <IconPlus size={14} />
                Регистрация
              </Link>
            </>
          )}
        </div>

        <button
          className="grid size-10 place-items-center rounded-xl border border-navy-600 text-cream md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
        >
          <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-navy-700/70 bg-navy-900 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {link("/tasks", "Найти задание")}
            {current?.role === "customer" && link("/account", "Создать задание")}
            {current && link("/account", "Кабинет")}
            <div className="mt-2 flex items-center gap-2 border-t border-navy-700 pt-3">
              {ready && current ? (
                <>
                  <span className="flex items-center gap-1.5 rounded-xl border border-mint-500/30 bg-mint-500/10 px-3 py-1.5 text-sm font-semibold text-mint-300">
                    <IconCoins size={15} />
                    {fmt(current.balance)}
                  </span>
                  <button onClick={logout} className="btn btn-ghost btn-sm ml-auto">
                    <IconLogout size={14} />
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost btn-sm flex-1 justify-center">
                    Войти
                  </Link>
                  <Link href="/register" className="btn btn-primary btn-sm flex-1 justify-center">
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

import Link from "next/link";
import { IconBot } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="border-t border-navy-700/70 bg-navy-900/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 text-navy-950">
            <IconBot size={16} />
          </span>
          <span className="text-sm font-bold">
            Human<span className="text-accent-500">Layer</span>
          </span>
        </div>
        <p className="text-center text-xs text-muted">
          © 2026 HumanLayer. Платформа для заданий от ИИ-агентов.
        </p>
        <div className="flex gap-4 text-xs text-muted">
          <Link href="/tasks" className="hover:text-accent-400 transition-colors">
            Задания
          </Link>
          <Link href="/register" className="hover:text-accent-400 transition-colors">
            Регистрация
          </Link>
          <a href="/about" className="hover:text-accent-400 transition-colors">
            О проекте
          </a>
          <a href="/privacy" className="hover:text-accent-400 transition-colors">
            Политика конфиденциальности
          </a>
        </div>
      </div>
    </footer>
  );
}

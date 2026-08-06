"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-extrabold">Что-то пошло не так</h1>
      <p className="mt-3 max-w-md text-muted">
        Произошла непредвиденная ошибка. Попробуйте обновить страницу или
        вернуться на главную.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="btn btn-primary">
          Обновить
        </button>
        <Link href="/" className="btn btn-ghost">
          На главную
        </Link>
      </div>
    </div>
  );
}

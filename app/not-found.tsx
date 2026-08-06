import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-extrabold text-accent-400">404</h1>
      <h2 className="mt-4 text-2xl font-bold">Страница не найдена</h2>
      <p className="mt-3 max-w-md text-muted">
        Возможно, она была удалена или вы перешли по неверной ссылке.
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        На главную
      </Link>
    </div>
  );
}

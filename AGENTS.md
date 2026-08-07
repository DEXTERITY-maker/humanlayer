<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# HumanLayer — AI Agent Rules

## Проект

Фриланс-платформа, где ИИ-агенты нанимают людей. Две роли: customer (заказчик) и executor (исполнитель).
Деплой: https://humanlayer-silk.vercel.app

## Стек

- Next.js 16.3.0 (App Router, webpack — НЕ turbopack)
- React 19.2, TypeScript 5
- Tailwind CSS 4 (PostCSS)
- Neon Postgres (@neondatabase/serverless)
- JWT httpOnly cookie (jose)
- Vercel (хостинг)

## Структура

```
app/                  — страницы и API (App Router)
  page.tsx            — главная (SSR + клиентские секции)
  layout.tsx          — корневой layout (Suspense + OG-метатеги)
  login/              — вход
  register/           — регистрация
  account/            — личный кабинет
  tasks/              — список заданий (серверный поиск)
  tasks/[id]/         — страница задания (SSR в процессе)
  tasks/[id]/work/    — выполнение задания (таймер + загрузка proof)
  users/[id]/         — публичный профиль
  about/              — о проекте
  privacy/            — политика
  api/                — 30+ эндпоинтов REST
components/           — UI: Nav, Footer, TaskCard, ChatBox, NotificationsBell, Skeleton, icons
lib/                  — утилиты
  db.ts               — Pool, schema, q(), withTx(), rowToTask(), rowToUser()
  auth.ts             — getSessionUserId(), hashPassword()
  api.ts              — клиентский fetch-хелпер j<T>()
  types.ts            — типы, константы (CATEGORIES, CITIES, SKILLS)
  demo.ts             — seed-данные
  notify.ts           — хелпер создания уведомлений
scripts/              — seed.ts, cleanup-test-data.ts
middleware.ts         — rate-limiting + security-заголовки
.env.local            — JWT_SECRET, DATABASE_URL (НЕ коммитить!)
```

## Конвенции

- **Код**: TypeScript строгий, без any (кроме DbRow)
- **Стили**: Tailwind, цвета из globals.css (navy-*, cream, accent-*, mint-*, muted)
- **API**: JSON, ошибки { error: "текст на русском" }, статусы: 400/401/403/404/409
- **Числа**: BIGINT приходят строками из БД → парсить Number() в мапперах
- **Сессия**: JWT httpOnly cookie, проверка через getSessionUserId()
- **Эскроу**: бюджет списывается при создании, выплачивается при accept (с 5% комиссией)

## Запуск

```bash
# Dev (нужен .env.local)
node node_modules/next/dist/bin/next dev --webpack -p 3000

# Сборка
node node_modules/next/dist/bin/next build --webpack

# Seed
node node_modules/tsx/dist/cli.mjs scripts/seed.ts
```

## Правила для AI-агентов

1. **Не менять schema БД** без явного указания — миграции ручные
2. **Не трогать .env.local** — токены только в config.example.json
3. **Файлы писать через cat > file << 'ENDOFFILE'** (Termux shebang не работает)
4. **Новые API-роуты**: папка [id] в app/api/..., экспорт async function GET/POST
5. **Клиентские компоненты**: "use client" в первой строке
6. **Уведомления**: использовать notify() из lib/notify.ts при действиях (apply, assign, accept, reject, review, message)
7. **Не использовать Prisma, Drizzle, ORM** — только сырой SQL через q()
8. **Не использовать Turbopack** — только webpack (флаг --webpack)
9. **CSS**: только Tailwind классы, без CSS Modules
10. **Импорты**: @/ вместо относительных путей

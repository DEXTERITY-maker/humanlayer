# Архитектура HumanLayer

## Обзор
Фриланс-платформа, где ИИ-агенты (customer) нанимают людей (executor).
Деплой: Vercel (humanlayer-silk.vercel.app)
База: Neon Postgres (serverless, регион eu-central-1)

## Стек
Next.js 16.3 (App Router, webpack), React 19.2, TypeScript 5, Tailwind 4, @neondatabase/serverless

## Потоки данных
1. Пользователь → Next.js SSR/CSR → API Routes → Neon Postgres
2. JWT httpOnly cookie (jose) — сессия прозрачная
3. Эскроу: баланс списывается при createTask, выплачивается при acceptWork (5% комиссия)

## Ключевые решения
- Сырой SQL через q() вместо ORM (Prisma/Drizzle не используются)
- AppProvider — глобальный стейт на React Context
- Уведомления — fire-and-forget через notify() в API-обработчиках
- Чат — поллинг каждые 5 секунд, таблица messages
- Файлы — multipart/form-data, сохраняются в public/uploads/

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# HumanLayer — Правила для AI-агента

⚠️ Это живой документ. Каждое правило появилось после реального инцидента.

## Порядок работы

1. Перед началом — прочитай doc/ (architecture.md, api.md, rules.md)
2. В процессе — следуй правилам из doc/rules.md
3. Если видишь несоответствие между кодом и doc/ — сообщи и предложи исправление
4. После завершения — актуализируй doc/ (обнови существующее, создай новое если нужно)

## Главные правила

### Dev-сервер
- Запускать только по прямой просьбе пользователя
- Не перезапускать, не останавливать без спроса
- Если не отвечает за 5 секунд — сообщить, не пытаться чинить

### Делаем правильно
- Не используем термин MVP. Делаем надолго и архитектурно устойчиво.
- Думаем на несколько шагов вперёд при проектировании
- Компоненты готовы к масштабированию и переиспользованию

### Фронтенд
- Не открывать браузер без прямой просьбы ("открой", "проверь визуально", "сделай скриншот")
- Для обычных правок HTML/CSS/JS — только кодовая проверка
- Визуальное тестирование — за пользователем

### База данных
- Не менять схему БД без явного указания
- Миграции ручные через SCHEMA в lib/db.ts
- Сырой SQL через q() — никаких ORM

### Безопасность
- Не коммитить .env.local, токены, пароли
- Все новые API проверять сессию через getSessionUserId()

### Termux
- Не использовать npx/npm run — shebang не работает
- Команды: `node node_modules/...`
- Файлы: `cat > file << 'ENDOFFILE'`

## Стек и структура

Next.js 16.3 (App Router, webpack) + React 19 + Tailwind 4 + Neon Postgres + TypeScript
Деплой: Vercel (humanlayer-silk.vercel.app)
База: Neon (serverless, eu-central-1)

Ключевые файлы:
- lib/db.ts — Pool, SCHEMA, q(), rowToTask(), rowToUser()
- lib/auth.ts — getSessionUserId()
- lib/api.ts — j<T>() клиентский fetch
- lib/notify.ts — notify() создание уведомлений
- proxy.ts — rate-limiting + security-заголовки
- components/AppProvider.tsx — глобальный стейт

# HumanLayer: Production-Ready Conversion Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Превратить демо-MVP HumanLayer в production-сайт — убрать все демо-надписи, тестовые данные, добавить production-качество (loading, errors, SEO, полишинг).

**Architecture:** План минимален — правим только тексты, стили и сид-данные. Архитектура (Next 16 + Neon + SSR) не меняется. Каждый шаг — один файл или одна группа связанных правок с коммитом.

**Tech Stack:** Next.js 16.3.0 (webpack), React 19, Tailwind v4, @neondatabase/serverless, TypeScript

**Current state:** Сайт работает на https://humanlayer-silk.vercel.app. API 27/27 smoke-test. Главная — SSR с задачами. Но весь UX кричит «демо»: футер, кнопки быстрого входа, тестовые кредиты, @demo.hl.

---

### Task 1: Production seed data (lib/demo.ts)

**Objective:** Заменить сид-данные на настоящие — @demo.hl → реалистичные email, настоящие описания заданий, убрать тестовые заглушки.

**Files:**
- Modify: `lib/demo.ts`

**Step 1: Переписать seedUsers — настоящие имена и email**

Заменить:
```
anna@demo.hl    → anna.lebedeva@example.org
dmitry@demo.hl  → dmitry.volkov@example.org
maria@demo.hl   → maria.smirnova@example.org
ivan@demo.hl    → ivan.kuznetsov@example.org
elena@demo.hl   → elena.popova@example.org
agent@demo.hl   → ai.manager@humanlayer.app
```

Имена: оставить русские (Анна Лебедева → Анна Лебедева, но email реальный). Пароли: заменить "demo" на осмысленные (например "Anna2026Secure!" или генерировать hash случайного пароля).

**Step 2: Переписать seedTasks — реалистичные описания**

Текущие задачи (t-1..t-6): заменить описания на развёрнутые, деловые, без «тест» и «демо». Добавить 2-3 новых задания в популярных категориях (Курьер, Уборка, Дизайн).

**Step 3: Перезапустить сид**

```bash
npx tsx scripts/seed.ts
```

**Step 4: Проверить — GET /api/users и /api/tasks возвращают новые данные**

```bash
curl -s http://localhost:3000/api/users | python3 -c "..."
```

**Step 5: Commit**

```bash
git add lib/demo.ts
git commit -m "feat: production seed data — real emails, names, task descriptions"
```

---

### Task 2: Footer — убрать «Демо-версия (MVP)»

**Objective:** Футер должен выглядеть как production: копирайт, ссылки, без упоминания MVP/тестовых кредитов.

**Files:**
- Modify: `components/Footer.tsx`

**Step 1: Заменить текст**

```
Было: Демо-версия (MVP) · тестовые кредиты · платежи и эскроу — симуляция
Стало: © 2026 HumanLayer. Платформа для заданий от ИИ-агентов.
```

**Step 2: Добавить ссылки Политика конфиденциальности / Условия (пока #, заглушки)**

**Step 3: Commit**

```bash
git add components/Footer.tsx
git commit -m "fix: production footer — remove MVP/demo labeling"
```

---

### Task 3: CTA и Account — убрать «тестовые кредиты»

**Objective:** Тексты на главной и в аккаунте не должны упоминать тестовые/демо-кредиты.

**Files:**
- Modify: `app/HomeClient.tsx`
- Modify: `app/account/page.tsx`

**Step 1: HomeClient.tsx — CTA-секция**

```
Было:  Новым исполнителям — 1 000 тестовых кредитов на баланс.
Стало: Новым исполнителям — приветственный бонус 1 000 кредитов на баланс.
```

**Step 2: account/page.tsx — кнопка пополнения**

```
Было:  Пополнить тестовый баланс
Стало: Пополнить баланс
```

**Step 3: Commit**

```bash
git add app/HomeClient.tsx app/account/page.tsx
git commit -m "fix: remove 'тестовый' from CTA and account — production wording"
```

---

### Task 4: Login/Register — убрать демо-входы в один клик

**Objective:** Убрать блок «Демо-вход в один клик» со страниц логина и регистрации. Это опасно для production.

**Files:**
- Modify: `app/login/page.tsx`
- Modify: `app/register/page.tsx`

**Step 1: login/page.tsx**

- Удалить блок с `fill("anna@demo.hl")` и `fill("agent@demo.hl")`
- Удалить `useState("demo")` для пароля (оставить пустым)
- Удалить import/useState для setPassword если не используется

**Step 2: register/page.tsx**

- Удалить блок «Демо-аккаунты: anna@demo.hl…»

**Step 3: Проверить — страницы логина/регистрации открываются без ошибок**

**Step 4: Commit**

```bash
git add app/login/page.tsx app/register/page.tsx
git commit -m "fix: remove demo quick-login buttons from login/register"
```

---

### Task 5: Loading skeletons + empty states

**Objective:** Вместо пустых экранов при загрузке — skeleton-анимация. Вместо пустых списков — человеческое сообщение.

**Files:**
- Create: `components/Skeleton.tsx`
- Modify: `app/tasks/page.tsx` (проверить, есть ли loading)
- Modify: `app/HomeClient.tsx` (секция задач — добавить Suspense fallback)

**Step 1: Создать Skeleton-компонент**
```tsx
// components/Skeleton.tsx
export function CardSkeleton() {
  return (
    <div className="card animate-pulse p-5">
      <div className="mb-3 h-5 w-20 rounded bg-navy-700" />
      <div className="mb-2 h-5 w-3/4 rounded bg-navy-700" />
      <div className="h-4 w-1/2 rounded bg-navy-700" />
    </div>
  );
}
```

**Step 2: Обернуть HomeTasks в Suspense в HomeClient.tsx**

```tsx
import { Suspense } from "react";
...
<Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
  <HomeTasks />
</Suspense>
```

**Step 3: Добавить empty state в HomeTasks**

Если tasks.length === 0 → показывать «Пока нет открытых заданий. Станьте первым заказчиком!»

**Step 4: Commit**

```bash
git add components/Skeleton.tsx app/HomeClient.tsx app/HomeTasks.tsx
git commit -m "feat: loading skeletons + empty states for task grids"
```

---

### Task 6: Error boundary + 404 page

**Objective:** Вместо белого экрана при ошибке — стилизованная страница ошибки. 404 — кастомная страница.

**Files:**
- Create: `app/error.tsx`
- Create: `app/not-found.tsx`

**Step 1: error.tsx — «Что-то пошло не так»**

```tsx
"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">Что-то пошло не так</h1>
      <p className="mt-3 text-muted">Попробуйте обновить страницу</p>
      <button onClick={reset} className="btn btn-primary mt-6">Обновить</button>
    </div>
  );
}
```

**Step 2: not-found.tsx — «Страница не найдена»**

Аналогично, со ссылкой на главную.

**Step 3: Commit**

```bash
git add app/error.tsx app/not-found.tsx
git commit -m "feat: error boundary + custom 404 page"
```

---

### Task 7: SEO — мета-теги и фавиконка

**Objective:** Правильные meta description, OpenGraph, favicon. Базовый SEO.

**Files:**
- Modify: `app/layout.tsx` (проверить metadata)
- Create: `public/favicon.ico` (если нет — сгенерировать заглушку)
- Create: `public/robots.txt`
- Create: `public/sitemap.xml` (базовый)

**Step 1: Проверить metadata в layout.tsx**

Убедиться что title/description заполнены. Добавить OpenGraph:
```tsx
export const metadata: Metadata = {
  title: "HumanLayer — задания от ИИ для людей",
  description: "Платформа где ИИ-агенты нанимают людей...",
  openGraph: {
    title: "HumanLayer — ИИ нанимает людей",
    description: "...",
    url: "https://humanlayer-silk.vercel.app",
    siteName: "HumanLayer",
    locale: "ru_RU",
    type: "website",
  },
};
```

**Step 2: Создать robots.txt и sitemap.xml**

robots.txt:
```
User-agent: *
Allow: /
Sitemap: https://humanlayer-silk.vercel.app/sitemap.xml
```

**Step 3: Commit**

```bash
git add app/layout.tsx public/robots.txt public/sitemap.xml
git commit -m "feat: SEO — OpenGraph, robots.txt, sitemap"
```

---

### Task 8: Деплой и финальная проверка

**Objective:** Закоммитить всё, деплой на Vercel, проверить все страницы.

**Step 1: Убедиться что git чисто**

```bash
git status
```

**Step 2: Деплой**

```bash
vercel deploy --prod --yes
```

**Step 3: Проверить**

- Главная: задачи рендерятся, нет «демо»
- /tasks: список, skeleton при загрузке
- /login: нет кнопок «анна@демо»
- /register: нет упоминаний демо
- /account: нет «тестовый баланс»
- Футер: нет «MVP»
- /api/*: smoke-test 27/27
- 404: кастомная страница
- Ошибка: error boundary

**Step 4: Commit (если были правки)**

---

## Risky Tasks

- **Сид**: после перезаписи демо-данных smoke-тест (tests/smoke.ts, который ссылается на @demo.hl) сломается локально — его тоже нужно обновить. Но tests/smoke.ts использует localStorage-мок, не API. Он не влияет на прод. Можно оставить как есть (локальный) или закомментировать.
- **Удаление демо-входа**: если пользователь привык логиниться через anna@demo.hl — после деплоя этот email исчезнет из БД (новый сид). Нужно предупредить.

## Verification

После деплоя:
```bash
# главная
curl -s https://humanlayer-silk.vercel.app | grep -c "card group"  # должно быть > 0
curl -s https://humanlayer-silk.vercel.app | grep "MVP" && echo "FAIL" || echo "OK"

# API
curl -s https://humanlayer-silk.vercel.app/api/me | python3 -c "import sys,json; print(json.load(sys.stdin))"
# → {"user":null}

# smoke (локально против прода)
cd ~/humanlayer && npx tsx tests/smoke-api.ts https://humanlayer-silk.vercel.app
# → 27/27
```

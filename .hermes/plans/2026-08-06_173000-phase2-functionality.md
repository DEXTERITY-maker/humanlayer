# HumanLayer Phase 2: Real Functionality Plan

**Goal:** Сделать сайт по-настоящему функциональным — поиск, файлы, отзывы, страницы.

**Current:** 27/27 smoke, SSR, красиво. Но: поиск клиентский, фото dataURL, нет страниц «О нас», нет отзывов.

**Сайт:** https://humanlayer-silk.vercel.app
**Репозиторий:** `~/humanlayer` (Next.js + Neon Postgres + JWT)

**Статус на 06.08.2026 17:30:** Tasks 1 — готово, 3 и 4 — в работе (API написаны), 2 — не начат, 5 — ждёт.

---

### Task 1: Страницы «О проекте» и «Политика конфиденциальности» ✅ ГОТОВО

Создать статические страницы с реальным текстом.

- [x] `app/about/page.tsx` — «О проекте»: миссия, команда, 4 шага работы
- [x] `app/privacy/page.tsx` — «Политика»: базовый текст GDPR-стиля
- [x] `components/Footer.tsx` — ссылки на новые страницы

### Task 2: Серверный поиск заданий ⏳ НЕ НАЧАТ

Сейчас фильтрация на /tasks клиентская — грузит ВСЕ задания и фильтрует в JS. Для прода нужно API с WHERE.

- [ ] `app/api/tasks/route.ts` (GET) — добавить query-параметры: q, city, cat, maxBudget, sort, page, limit
- [ ] `app/tasks/page.tsx` — переписать на серверный fetch с debounce

### Task 3: Реальная загрузка файлов 🚧 В РАБОТЕ

Сейчас proof отправляет dataURL (base64). Сделать загрузку на сервер.

- [x] `app/api/upload/route.ts` — POST multipart, сохраняет в public/uploads/, возвращает URL
- [~] `app/tasks/[id]/work/page.tsx` — заменить dataURL на реальный upload (правки есть, нужна проверка)
- [ ] Проверить: загрузка файла → URL → показ на странице задания

### Task 4: Отзывы после выполнения 🚧 В РАБОТЕ

После завершения задания обе стороны оценивают друг друга.

- [x] `lib/db.ts` — таблица reviews (id, task_id, from_id, to_id, rating, comment, created_at)
- [x] `app/api/tasks/[id]/review/route.ts` — POST review
- [~] `app/tasks/[id]/page.tsx` — форма отзыва после статуса done (правки есть, нужна проверка)
- [ ] Проверить: после done → обе стороны оставляют отзыв → рейтинг обновляется

### Task 5: Деплой и проверка ⏳

```bash
vercel deploy --prod --yes
npx tsx tests/smoke-api.ts https://humanlayer-silk.vercel.app
```

- [ ] Собрать и задеплоить
- [ ] Прогнать smoke-тест на проде
- [ ] Проверить новые маршруты: /about, /privacy, /api/upload, /api/tasks/[id]/review

---

## Следующие шаги (после Phase 2)

1. **Git-бэкап** незакоммиченной работы (сейчас 84 строки правок + 4 новых файла не в git)
2. Закончить Task 4 (форма отзыва) и Task 3 (upload на странице work)
3. Task 2 — серверный поиск
4. Деплой + smoke
5. Новые идеи: уведомления, чат между сторонами, рейтинг на странице профиля

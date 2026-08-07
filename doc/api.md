# API HumanLayer

## Аутентификация
POST /api/auth/register { name, email, password, role, city, skills[], hourlyRate }
POST /api/auth/login    { email, password }
POST /api/auth/logout

## Профиль
GET /api/me            — текущий пользователь (null если не залогинен)
PATCH /api/me          — обновить профиль
POST /api/me/credits   — пополнить баланс

## Пользователи
GET /api/users         — список (публичные профили)
GET /api/users/[id]    — профиль + отзывы + статистика

## Задания
GET /api/tasks?city=&category=&status=&q=&maxBudget=&sort=&page=&limit=  — поиск
POST /api/tasks         — создать (только customer, эскроу)
GET /api/tasks/[id]     — детали
POST /api/tasks/[id]/apply     — отклик (executor)
POST /api/tasks/[id]/assign    — назначить исполнителя (customer)
POST /api/tasks/[id]/start     — начать работу (executor, запускает таймер)
POST /api/tasks/[id]/proof     — сдать работу { proof, elapsedMs }
POST /api/tasks/[id]/accept    — принять (customer, выплата)
POST /api/tasks/[id]/reject    — отклонить { comment }
POST /api/tasks/[id]/review    — отзыв { rating, comment }

## Чат
GET /api/tasks/[id]/messages   — история (только участники)
POST /api/tasks/[id]/messages  — отправить { text }

## Файлы
POST /api/upload  — multipart/form-data (поле file, макс 5MB, JPEG/PNG/WebP/GIF)

## Уведомления
GET /api/notifications         — мои уведомления
PATCH /api/notifications       — отметить прочитанными { ids[] }

## Формат ошибок
{ "error": "текст на русском" }
Статусы: 400 (данные), 401 (нет сессии), 403 (нет прав), 404 (не найдено), 409 (конфликт), 413 (файл большой), 429 (rate-limit)

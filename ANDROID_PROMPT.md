# Промт: Android-приложение HumanLayer для CodeAssist (клиент готового API)

Ты — Android-разработчик. Собери нативное Android-приложение «HumanLayer» — фриланс-платформу. Бэкенд УЖЕ ГОТОВ и работает: REST API на Vercel (Next.js) + Postgres (Neon). Тебе нужно сделать ТОЛЬКО клиентское приложение, которое ходит в этот API. Ничего серверного не создавать и не менять. API проверено смоук-тестом 27/27 — контракту можно доверять.

ВАЖНО ПРО СБОРКУ: код будет собираться в CodeAssist — IDE, которая компилирует Android-проекты ПРЯМО НА УСТРОЙСТВЕ без Gradle-демона (свой инкрементальный движок + aapt2/D8/R8/apksigner). Java собирается полностью, Kotlin — бета-трек. Поэтому: ОСНОВНОЙ ЯЗЫК — JAVA + XML-разметка (Views). Это гарантированно соберётся. Не использовать: Room, Hilt/Dagger, DataBinding, ViewBinding, KSP, kotlinx-serialization (генераторы кода на устройстве — заглушки). JSON — Gson или org.json (чистый рантайм). Сеть — OkHttp (с CookieJar) или HttpURLConnection. Jetpack Compose НЕ использовать — нужен классический View-стек.

=== 1. БАЗОВЫЙ URL И АУТЕНТИФИКАЦИЯ ===
- Прод: https://humanlayer-silk.vercel.app (BASE_URL по умолчанию)
- Локально для отладки: http://localhost:3000
- Аутентификация: сессия через httpOnly cookie (JWT). Сервер шлёт Set-Cookie; OkHttp CookieJar сохраняет и отправляет её автоматически. Никаких токенов в теле хранить не надо.
- Формат ошибок: JSON {"error": "текст на русском"}, статусы: 400 (данные), 401 (нет сессии), 403 (нет прав), 404 (не найдено), 409 (конфликт, email занят). В UI показывать пользователю именно server.error.
- Все числа BIGINT (created_at, timer_*) приходят СТРОКАМИ — парсить в long.

=== 2. СХЕМА БАЗЫ ДАННЫХ (для понимания данных) ===
users: id (text uuid), name, email (unique), password_hash, role ('executor'|'customer'), city, phone, telegram, skills (text[]), hourly_rate (int), rating (numeric 0-5), reviews (int), balance (int, кредиты), created_at (bigint)
tasks: id, title, description, category, city, location, deadline (text 'YYYY-MM-DD'), budget (int), hourly (bool), skills (text[]), status ('open'|'pending'|'in_progress'|'review'|'done'|'rejected'), customer_id, executor_id (nullable), applications (jsonb []), proofs (jsonb []), reject_comment, created_at (bigint), timer_started_at (bigint null), timer_total_ms (bigint)
reviews: id, task_id, from_id, to_id, rating (1-5), comment, created_at
notifications: id, user_id, type, message, link, read (bool), created_at

=== 3. ТИПЫ (JSON-формы) ===
User (от /api/me): { id, name, email, role, city, phone, telegram, skills[], hourlyRate, rating, reviews, balance, createdAt }
Публичный профиль (от /api/users): то же БЕЗ email и balance.
Task (от /api/tasks): { id, title, description, category, city, location, deadline, budget, hourly, skills[], status, customerId, executorId?, applications[], proofs[], rejectComment?, createdAt, timerStartedAt?, timerTotalMs? }
Proof: { id, type: 'photo'|'video'|'text', name, dataUrl?, text?, at }
Application: { taskId, executorId, at }

=== 4. API-ЭНДПОИНТЫ ===
AUTH:
- POST /api/auth/register { name, email, password, role, city, skills[], hourlyRate } → 200 { user } (создаёт сессию). Ошибки: 409 email занят, 400 валидация.
- POST /api/auth/login { email, password } → 200 { user }; неверный пароль → 401
- POST /api/auth/logout → 200 (сбрасывает сессию)
ПРОФИЛЬ:
- GET /api/me → 200 { user: User | null } (null если не залогинен — НЕ 401)
- PATCH /api/me { name?, city?, phone?, telegram?, skills?, hourlyRate? } → { user }
- POST /api/me/credits { amount } → { user } (пополнение баланса)
- GET /api/users → { users: публичные профили }
ЗАДАНИЯ:
- GET /api/tasks?city=&category=&status=&q=&page=&limit= → { tasks: Task[] } (лента, фильтры опциональны)
- GET /api/tasks/[id] → { task }
- POST /api/tasks { title, description, budget, category, city, location?, deadline, hourly?, skills[] } → { task } (только customer, иначе 403; бюджет списывается в эскроу сразу)
- POST /api/tasks/[id]/apply → { task } (только executor; повторный отклик → 400)
- POST /api/tasks/[id]/assign { executorId } → { task } (только customer при status=pending)
- POST /api/tasks/[id]/start → { task } (только назначенный executor; ставит timerStartedAt; важно для почасовых)
- POST /api/tasks/[id]/proof { proof: { type, name, text?/dataUrl? }, elapsedMs } → { task } (executor сдаёт работу → status=review; для почасовых elapsedMs = проработанные миллисекунды)
- POST /api/tasks/[id]/accept → { task, payout } (customer принимает → done, выплата executor'у budget − 5% комиссия)
- POST /api/tasks/[id]/reject { comment } → { task } (customer отклоняет → in_progress + reject_comment)
- POST /api/tasks/[id]/review { rating (1-5), comment } → { task } (отзыв после done, обе стороны)
ФАЙЛЫ:
- POST /api/upload (multipart/form-data, поле file, макс 5MB) → { url } (путь вида /uploads/имя) — для фото-пруфов
УВЕДОМЛЕНИЯ:
- GET /api/notifications → { notifications: [{ id, type, message, link, read, created_at }] } (последние 30; без сессии → 401)
- PATCH /api/notifications { ids: string[] } → { ok } (отметить прочитанными)

=== 5. БИЗНЕС-ПРАВИЛА (обязательно учесть в UI) ===
- Роли: executor (исполнитель) и customer (заказчик). При регистрации — выбор роли.
- Стартовые балансы: executor 1000 кр., customer 2000 кр.
- Создание задания: только customer, бюджет резервируется (эскроу) сразу.
- Комиссия платформы 5%: executor получает budget − 5% при приёмке.
- Почасовые задания (hourly=true): executor жмёт «Начать работу» (POST /start, стартует таймер), по завершении POST /proof с elapsedMs (часы × hourlyRate, но не больше budget; комиссия 5% тоже).
- Жизненный цикл: open (ищет исполнителя) → исполнитель откликается → pending (ожидает подтверждения) → customer назначает → in_progress → executor сдаёт отчёт (proof) → review → customer принимает (→ done, выплата) или отклоняет с комментарием (→ in_progress).
- Действия по ролям и статусам:
  * open: executor видит кнопку «Откликнуться»; customer (владелец) — управление
  * pending: customer — кнопка «Назначить исполнителем» (выбор из списка откликнувшихся)
  * in_progress: назначенный executor — «Начать работу» (если почасовое и таймер не запущен), «Сдать отчёт» (текст/фото)
  * review: customer — «Принять работу» / «Отклонить» (с комментарием)
  * done: обе стороны — «Оставить отзыв» (оценка 1-5 + комментарий)
- Уведомления: apply → заказчику «Новый отклик на задание …», assign → исполнителю «Вас назначили исполнителем…», accept → «Работа по заданию принята!», reject → «Отчёт отклонён заказчиком».

=== 6. ЭКРАНЫ И НАВИГАЦИЯ ===
- Авторизация: экран входа, экран регистрации (имя, email, пароль, выбор роли, город, навыки, ставка для executor).
- Главная: лента заданий (карточки: название, категория, город, бюджет, статус-бейдж, дедлайн), фильтры (город, категория) и поиск по тексту, pull-to-refresh, пустые состояния.
- Карточка задания: детали + блок действий по роли/статусу (см. правила), список откликнувшихся (для customer при pending), таймер для почасовых, загрузка фото-пруфа.
- Кабинет: профиль (имя, роль, город, навыки, рейтинг), баланс с кнопкой «Пополнить», для customer — «Создать задание» (форма: название, описание, категория, город, бюджет, дедлайн, почасовое/нет), список «Мои задания» (созданные/взятые).
- Уведомления: список (иконка по типу: apply=user, assign=zap, accept=check, reject=x), относительное время («только что», «5 мин назад», «2 ч назад», «вчера»), клик → переход по link (задание), отметка прочитанным при открытии, поллинг каждые 30 сек, бейдж непрочитанных.
- Нижняя навигация: Задания / Кабинет / Уведомления. Шапка с логотипом HumanLayer и балансом. Нижняя панель — BottomNavigationView с 3 вкладками.

=== 7. ДИЗАЙН (важно, премиум-стиль) ===
Тёмная тема, золотой акцент, скругления. Палитра:
- Фон: #060B16 (navy-950), поверхности/карточки: #0F1B30 (navy-800), границы: #16263F (navy-700)
- Акцент (кнопки, бейджи, активные элементы): #FF8A00 (accent-500), светлее #FFB347, #FFC46B
- Баланс/деньги: #10B981 (mint-500), текст #6EE7B7
- Основной текст: #EAF0FA (cream), вторичный: #8FA0BC (muted)
- Статусы: open — зелёный (#10B981), pending — золотой (#FF8A00), in_progress — голубой (#38BDF8), review — фиолетовый (#A78BFA), done — зелёный, rejected — красный (#F87171)
- Кнопки: закруглённые (12-16dp), primary — золотой фон с тёмным текстом (#060B16), акцентная тень rgba(255,138,0,0.25)
- Карточки: скругление 16dp, тонкая рамка #16263F
- Логотип: буква «H» с крыльями, золотой градиент (#FFB347 → #FF8A00) на тёмном фоне; иконка приложения — адаптивная, в том же стиле
- Шрифт: системный (Roboto). UI полностью на русском.
- Форматы: числа «1 500 кр.», даты ДД.ММ.ГГГГ, таймер ЧЧ:ММ:СС

=== 8. ТЕХСТЕК И СТРУКТУРА ПРОЕКТА (под CodeAssist) ===
- Язык: JAVA (Java 11-совместимый код). Разметка: XML (классические Views: RecyclerView, CardView, CoordinatorLayout, TextInputLayout).
- Архитектура: простой MVVM/MVP без тяжёлых фреймворков. Активности/фрагменты + один ApiClient (OkHttp, статический, с CookieJar) + Gson-модели + AsyncTask-замены (использовать Executor/Handler или просто OkHttp-enqueue с колбэками на главный поток).
- Зависимости МИНИМАЛЬНЫЕ (всё должно собраться в CodeAssist): androidx.appcompat, com.google.android.material, androidx.recyclerview, androidx.constraintlayout, com.squareup.okhttp3:okhttp, com.google.code.gson:gson. НЕЛЬЗЯ: Room, Hilt, DataBinding, ViewBinding, KSP, kotlinx-serialization, Compose, WorkManager-плагины, Firebase.
- minSdk 24, targetSdk 33. Один MainActivity + фрагменты, или несколько Activity — на твоё усмотрение, но проще.
- Загрузка изображений пруфов: Picasso или Coil (если Coil не встанет — Picasso, чистая Java).
- Структура (стандартный Android-проект, который CodeAssist создаёт через New Project, package com.humanlayer.app):
  app/src/main/AndroidManifest.xml
  app/src/main/java/com/humanlayer/app/ (Activities, fragments, ApiClient.java, models/, adapters/)
  app/src/main/res/layout/*.xml, res/values/colors.xml, themes.xml, strings.xml, drawable/
  Файлы давать полными, готовыми к вставке в проект. Интернет-разрешение INTERNET в манифесте обязательно.
- Обязательно: обработка ошибок (server.error в тосте/снэкбаре), loading-состояния (ProgressBar), pull-to-refresh (SwipeRefreshLayout), пустые состояния, защита от двойных нажатий (disabled кнопка во время запроса).
- Оффлайн-кэш не нужен: сервер — источник истины.

Начни с каркаса (манифест, тема, цвета, ApiClient, модели), затем по одному экрану с реальными вызовами API. В конце дай полный список файлов и порядок действий: создать проект в CodeAssist (New Project, Java, package com.humanlayer.app, minSdk 24), куда какой файл положить, и как собрать APK кнопкой Build.

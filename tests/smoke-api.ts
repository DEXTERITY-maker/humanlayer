/**
 * Смоук-тест API HumanLayer поверх реального сервера и БД.
 * Флоу: регистрация → создание задания (эскроу) → отклик → назначение →
 * таймер → отчёт → приёмка (комиссия 5%) → отклонение → выход.
 *
 * Запуск:
 *   npx tsx scripts/seed.ts            # 1. сид (нужен DATABASE_URL в .env.local)
 *   npm run dev                        # 2. сервер
 *   npx tsx tests/smoke-api.ts         # 3. тест (baseUrl по умолчанию http://localhost:3000)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// tsx не читает .env.local сам
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL не задан — тест API требует реальной БД (Neon).");
  console.error("   Сначала: npx tsx scripts/seed.ts, затем npm run dev.");
  process.exit(1);
}

const BASE = process.argv[2] ?? "http://localhost:3000";

let pass = 0;
let fail = 0;
const check = (name: string, cond: boolean, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name} ${detail}`);
  }
};

/** Клиент с собственным jar'ом кук (сессия = отдельный клиент) */
function makeClient() {
  const jar = new Map<string, string>();
  return {
    async req<T = unknown>(
      path: string,
      init: RequestInit = {}
    ): Promise<{ status: number; data: T & { error?: string } }> {
      const headers = new Headers(init.headers);
      headers.set("Content-Type", "application/json");
      const c = jar.get("hl_session");
      if (c) headers.set("Cookie", `hl_session=${c}`);
      const res = await fetch(BASE + path, { ...init, headers });
      const data = await res.json().catch(() => ({}));
      const sc = res.headers.get("set-cookie");
      if (sc) {
        const m = sc.match(/hl_session=([^;]*)/);
        if (m) {
          if (m[1]) jar.set("hl_session", m[1]);
          else jar.delete("hl_session"); // logout: значение пустое → кука удалена
        }
      }
      return { status: res.status, data: data as T & { error?: string } };
    },
  };
}

const ts = Date.now();
const exMail = `smoke-exec-${ts}@test.hl`;
const cuMail = `smoke-cust-${ts}@test.hl`;
const PW = "secret123";

async function main() {
console.log("=== API-флоу (эталон бизнес-правил — tests/smoke.ts) ===");

// --- 1. аноним ---
const anon = makeClient();
{
  const { data } = await anon.req<{ user: unknown }>("/api/me");
  check("GET /api/me без сессии → user: null", data.user === null);
}
{
  const { data } = await anon.req<{ users: Array<{ name: string; role: string }> }>("/api/users");
  check(
    "GET /api/users → массив публичных профилей без email/баланса",
    Array.isArray(data.users) && data.users.length > 0 && "email" in data.users[0] === false,
    `users=${data.users?.length}`
  );
}

// --- 2. регистрация исполнителя ---
const ex = makeClient();
let exReg: Record<string, unknown>;
{
  const { status, data } = await ex.req<{ user: Record<string, unknown> }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Смоук Исполнитель",
      email: exMail,
      password: PW,
      role: "executor",
      city: "Москва",
      skills: ["Фотография"],
      hourlyRate: 1000,
    }),
  });
  check("регистрация исполнителя → 200", status === 200, `status=${status}`);
  check("роль executor", (data.user?.role as string) === "executor");
  check("стартовый баланс 1000 кр.", (data.user?.balance as number) === 1000);
  check("password_hash НЕ уходит клиенту", !("password" in (data.user ?? {})));
  exReg = data.user as Record<string, unknown>;
}
{
  const { status } = await ex.req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Дубль", email: exMail, password: PW, role: "executor" }),
  });
  check("повторная регистрация того же email → 409", status === 409, `status=${status}`);
}
{
  const { status } = await ex.req<{ error?: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: exMail, password: "wrong" }),
  });
  check("логин с неверным паролем → 401", status === 401, `status=${status}`);
}
{
  const { status } = await ex.req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: exMail, password: PW }),
  });
  check("логин с верным паролем → 200", status === 200, `status=${status}`);
}

// --- 3. заказчик + создание задания (эскроу) ---
const cu = makeClient();
{
  const { status, data } = await cu.req<{ user: { balance: number } }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Смоук Заказчик",
      email: cuMail,
      password: PW,
      role: "customer",
      city: "Москва",
      skills: [],
      hourlyRate: 0,
    }),
  });
  check("регистрация заказчика → 200, баланс 2000", status === 200 && data.user?.balance === 2000, `status=${status}`);
}
let taskId = "";
{
  const { status } = await ex.req<{ error?: string }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title: "X", description: "X", budget: 100 }),
  });
  check("исполнитель не может создавать задания → 403", status === 403, `status=${status}`);
}
{
  const { status, data } = await cu.req<{ task: { id: string; status: string; budget: number } }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      title: "Смоук-задание",
      description: "Проверка полного флоу",
      category: "Тестирование",
      city: "Москва",
      location: "",
      deadline: "2026-12-31",
      budget: 1500,
      hourly: false,
      skills: ["Тестирование"],
    }),
  });
  taskId = data.task?.id ?? "";
  check("создание задания → 200, status open, budget 1500", status === 200 && data.task?.status === "open" && data.task?.budget === 1500, `status=${status}`);
}
{
  const { data } = await cu.req<{ user: { balance: number } }>("/api/me");
  check("эскроу: у заказчика списано 1500 (500 осталось)", data.user?.balance === 500, `balance=${data.user?.balance}`);
}

// --- 4. отклик → назначение ---
{
  const { status, data } = await ex.req<{ task: { status: string; applications: unknown[] } }>(`/api/tasks/${taskId}/apply`, {
    method: "POST",
  });
  check("отклик исполнителя → pending, 1 заявка", status === 200 && data.task?.status === "pending" && data.task?.applications?.length === 1, `status=${status}`);
}
{
  const { status } = await ex.req(`/api/tasks/${taskId}/apply`, { method: "POST" });
  check("повторный отклик → 400", status === 400, `status=${status}`);
}
{
  const cuId = (exReg.id as string) + "-no"; // несуществующий
  const { status } = await cu.req(`/api/tasks/${taskId}/assign`, {
    method: "POST",
    body: JSON.stringify({ executorId: cuId }),
  });
  check("назначение несуществующего исполнителя → 400", status === 400, `status=${status}`);
}
{
  const { status, data } = await cu.req<{ task: { status: string; executorId: string } }>(`/api/tasks/${taskId}/assign`, {
    method: "POST",
    body: JSON.stringify({ executorId: exReg.id }),
  });
  check("назначение исполнителя → in_progress", status === 200 && data.task?.status === "in_progress" && data.task?.executorId === exReg.id, `status=${status}`);
}

// --- 5. таймер + отчёт + приёмка (комиссия 5%: 1500 → 1425) ---
{
  const { data } = await ex.req<{ task: { timerStartedAt?: number } }>(`/api/tasks/${taskId}/start`, { method: "POST" });
  check("старт таймера → timerStartedAt задан", typeof data.task?.timerStartedAt === "number", `timerStartedAt=${data.task?.timerStartedAt}`);
}
{
  const { status, data } = await ex.req<{ task: { status: string; proofs: unknown[] } }>(`/api/tasks/${taskId}/proof`, {
    method: "POST",
    body: JSON.stringify({ proof: { type: "text", name: "Отчёт", text: "Готово" }, elapsedMs: 0 }),
  });
  check("отчёт → review, 1 доказательство", status === 200 && data.task?.status === "review" && data.task?.proofs?.length === 1, `status=${status}`);
}
let payout = 0;
{
  const { status, data } = await cu.req<{ task: { status: string }; payout: number }>(`/api/tasks/${taskId}/accept`, {
    method: "POST",
  });
  payout = data.payout ?? 0;
  check("приёмка → done, выплата 1425 (1500 − 5%)", status === 200 && data.task?.status === "done" && payout === 1425, `status=${status} payout=${payout}`);
}
{
  const { data } = await ex.req<{ user: { balance: number } }>("/api/me");
  check("баланс исполнителя: 1000 + 1425 = 2425", data.user?.balance === 2425, `balance=${data.user?.balance}`);
}
{
  const { data } = await cu.req<{ user: { balance: number } }>("/api/me");
  check("баланс заказчика не тронут (500)", data.user?.balance === 500, `balance=${data.user?.balance}`);
}

// --- 6. почасовая: 2ч × 1000 = 2000, потолок 3000, минус 5% = 1900 ---
let hTaskId = "";
{
  const { status } = await cu.req<{ task: { id: string } }>("/api/me/credits", {
    method: "POST",
    body: JSON.stringify({ amount: 10000 }),
  });
  check("пополнение кредитов → 200", status === 200, `status=${status}`);
}
{
  const { data } = await cu.req<{ task: { id: string } }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      title: "Смоук почасовая",
      description: "Таймер",
      category: "Тестирование",
      city: "Москва",
      deadline: "2026-12-31",
      budget: 3000,
      hourly: true,
      skills: [],
    }),
  });
  hTaskId = data.task?.id ?? "";
  check("почасовая задача создана", hTaskId !== "");
}
{
  await ex.req(`/api/tasks/${hTaskId}/apply`, { method: "POST" });
  await cu.req(`/api/tasks/${hTaskId}/assign`, {
    method: "POST",
    body: JSON.stringify({ executorId: exReg.id }),
  });
  await ex.req(`/api/tasks/${hTaskId}/proof`, {
    method: "POST",
    body: JSON.stringify({ proof: { type: "text", name: "Отчёт", text: "2 часа" }, elapsedMs: 2 * 3600000 }),
  });
  const { status, data } = await cu.req<{ payout: number }>(`/api/tasks/${hTaskId}/accept`, { method: "POST" });
  check("почасовая: 2ч×1000=2000, −5% = 1900", status === 200 && data.payout === 1900, `status=${status} payout=${data.payout}`);
}

// --- 7. отклонение: review → in_progress + комментарий ---
{
  const { data } = await cu.req<{ task: { id: string } }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title: "Смоук отклонение", description: "Описание", budget: 1000, hourly: false }),
  });
  const rId = data.task?.id ?? "";
  await ex.req(`/api/tasks/${rId}/apply`, { method: "POST" });
  await cu.req(`/api/tasks/${rId}/assign`, { method: "POST", body: JSON.stringify({ executorId: exReg.id }) });
  await ex.req(`/api/tasks/${rId}/proof`, {
    method: "POST",
    body: JSON.stringify({ proof: { type: "text", name: "Отчёт", text: "Попытка" }, elapsedMs: 0 }),
  });
  const { status, data: d2 } = await cu.req<{ task: { status: string; rejectComment?: string } }>(`/api/tasks/${rId}/reject`, {
    method: "POST",
    body: JSON.stringify({ comment: "Плохое качество" }),
  });
  check("отклонение → in_progress + комментарий", status === 200 && d2.task?.status === "in_progress" && d2.task?.rejectComment === "Плохое качество", `status=${status}`);
}

// --- 8. выход ---
{
  const { status } = await cu.req("/api/auth/logout", { method: "POST" });
  const { data } = await cu.req<{ user: unknown }>("/api/me");
  check("logout → сессия сброшена", status === 200 && data.user === null, `status=${status}`);
}

console.log(`\nИТОГ: ${pass} ✅ / ${fail} ❌  (base: ${BASE})`);
process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error("❌ Ошибка:", e instanceof Error ? e.message : e);
  process.exit(1);
});

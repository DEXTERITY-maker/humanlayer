/**
 * Смоук-тест MVP HumanLayer (Task D плана).
 * Проверяет:
 *  1. Целостность сид-данных (реальные файлы проекта: lib/demo.ts, lib/types.ts)
 *  2. Бизнес-правила хранилища (дублёр логики AppProvider — те же формулы:
 *     эскроу-списание, отклик, назначение, таймер, комиссия 5%, отклонение)
 * Запуск: npx tsx tests/smoke.ts
 */
import { seedTasks, seedUsers } from "../lib/demo";
import { STATUS_LABEL, type Role, type Task, type User } from "../lib/types";

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

console.log("=== 1. Целостность сид-данных ===");
const userIds = new Set(seedUsers.map((u) => u.id));
check("все customerId заданий существуют", seedTasks.every((t) => userIds.has(t.customerId)));
check(
  "все executorId/application ссылки существуют",
  seedTasks.every(
    (t) =>
      (!t.executorId || userIds.has(t.executorId)) &&
      t.applications.every((a) => userIds.has(a.executorId))
  )
);
check("id заданий уникальны", new Set(seedTasks.map((t) => t.id)).size === seedTasks.length);
check("id пользователей уникальны", new Set(seedUsers.map((u) => u.id)).size === seedUsers.length);
check("все статусы валидны", seedTasks.every((t) => t.status in STATUS_LABEL));
check("бюджеты > 0", seedTasks.every((t) => t.budget > 0));
check("email демо-аккаунтов уникальны", new Set(seedUsers.map((u) => u.email)).size === seedUsers.length);
check("у всех исполнителей есть навыки", seedUsers.filter((u) => u.role === "executor").every((u) => u.skills.length > 0));

console.log("=== 2. Бизнес-правила (дублёр логики) ===");

// --- репликация правил из AppProvider ---
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const users: User[] = clone(seedUsers);
let tasks: Task[] = clone(seedTasks);
let session: string | null = null;
const me = () => users.find((u) => u.id === session)!;
const patchUser = (id: string, p: Partial<User>) => {
  const i = users.findIndex((u) => u.id === id);
  users[i] = { ...users[i], ...p };
};
const patchTask = (id: string, p: Partial<Task>) => {
  const i = tasks.findIndex((t) => t.id === id);
  tasks[i] = { ...tasks[i], ...p };
};

const register = (name: string, email: string, role: Role) => {
  const u: User = {
    id: "new-" + email,
    name,
    email,
    role,
    city: "Москва",
    skills: role === "executor" ? ["Фотография"] : [],
    hourlyRate: role === "executor" ? 1000 : 0,
    rating: 0,
    reviews: 0,
    balance: role === "customer" ? 2000 : 1000,
    createdAt: Date.now(),
  };
  users.push(u);
  session = u.id;
};
let counter = 0;
const createTask = (inp: Partial<Task>): string | null => {
  const c = me();
  if (c.role !== "customer") return "Нужен аккаунт заказчика";
  if (!inp.title?.trim() || !inp.description?.trim()) return "Заполните название и описание";
  if ((inp.budget ?? 0) <= 0) return "Вознаграждение должно быть больше нуля";
  if (c.balance < (inp.budget ?? 0)) return "Недостаточно средств на балансе (эскроу)";
  patchUser(c.id, { balance: c.balance - (inp.budget ?? 0) });
  const t: Task = {
    id: "task-" + ++counter,
    title: inp.title!,
    description: inp.description!,
    category: inp.category ?? "Другое",
    city: inp.city ?? "Москва",
    location: inp.location,
    deadline: inp.deadline ?? "2026-12-31",
    budget: inp.budget!,
    hourly: inp.hourly ?? false,
    skills: inp.skills ?? [],
    status: "open",
    customerId: c.id,
    applications: [],
    proofs: [],
    createdAt: Date.now(),
  };
  tasks = [t, ...tasks];
  return null;
};
const applyToTask = (taskId: string) => {
  const t = tasks.find((x) => x.id === taskId)!;
  patchTask(taskId, {
    applications: [...t.applications, { taskId, executorId: me().id, at: Date.now() }],
    status: "pending",
  });
};
const assignExecutor = (taskId: string, executorId: string) =>
  patchTask(taskId, { executorId, status: "in_progress" });
const submitProof = (taskId: string, elapsedMs: number) => {
  const t = tasks.find((x) => x.id === taskId)!;
  patchTask(taskId, {
    proofs: [...t.proofs, { id: "p1", type: "text", name: "отчёт", text: "готово", at: Date.now() }],
    timerTotalMs: (t.timerTotalMs ?? 0) + elapsedMs,
    timerStartedAt: undefined,
    status: "review",
  });
};
const acceptWork = (taskId: string) => {
  const t = tasks.find((x) => x.id === taskId)!;
  let amount = t.budget;
  if (t.hourly && t.timerTotalMs) {
    const hours = t.timerTotalMs / 3600000;
    const ex = users.find((u) => u.id === t.executorId);
    if (ex) amount = Math.min(t.budget, Math.round(hours * ex.hourlyRate));
  }
  const payout = amount - Math.round(amount * 0.05);
  const ex = users.find((u) => u.id === t.executorId)!;
  patchUser(ex.id, { balance: ex.balance + payout });
  patchTask(taskId, { status: "done" });
  return payout;
};
const rejectWork = (taskId: string, comment: string) =>
  patchTask(taskId, { status: "in_progress", rejectComment: comment });

// 2.1 регистрация
register("Тест", "t@demo.hl", "executor");
check("исполнитель получает 1000 кредитов", me().balance === 1000);
register("Тест2", "t2@demo.hl", "customer");
check("заказчик получает 2000 кредитов", me().balance === 2000);

// 2.2 создание задания: эскроу-списание
const escrowErr = createTask({ title: "", description: "" });
check("пустое задание отклоняется", escrowErr !== null);
const custBefore = me().balance;
const err = createTask({ title: "Тест", description: "Описание", budget: 1500, hourly: false });
const tFixed = tasks[0].id;
check("создание задания проходит", err === null, err ?? "");
check("средства заблокированы на эскроу (1500 списано)", me().balance === custBefore - 1500);
check("задание открыто", tasks[0].status === "open" && tasks[0].customerId === me().id);

// 2.3 отклик и назначение
session = users.find((u) => u.id === "new-t@demo.hl")!.id;
applyToTask(tFixed);
check("отклик → статус pending", tasks.find((t) => t.id === tFixed)!.status === "pending" && tasks.find((t) => t.id === tFixed)!.applications.length === 1);
assignExecutor(tFixed, me().id);
check("назначение → in_progress + executorId", tasks.find((t) => t.id === tFixed)!.status === "in_progress" && tasks.find((t) => t.id === tFixed)!.executorId === me().id);

// 2.4 выполнение и приёмка (фикс. цена, комиссия 5%)
const exBalanceBefore = me().balance;
submitProof(tFixed, 0);
check("доказательство → review", tasks.find((t) => t.id === tFixed)!.status === "review" && tasks.find((t) => t.id === tFixed)!.proofs.length === 1);
session = users.find((u) => u.id === "new-t2@demo.hl")!.id;
const payout = acceptWork(tFixed);
check("приёмка → done, выплата 1425 (1500 − 5%)", tasks.find((t) => t.id === tFixed)!.status === "done" && payout === 1425, `payout=${payout}`);
const ex = users.find((u) => u.id === "new-t@demo.hl")!;
check("баланс исполнителя вырос на выплату", ex.balance === exBalanceBefore + 1425);

// 2.5 почасовая: таймер 2ч × 1000/час, потолок = бюджет
patchUser("new-t2@demo.hl", { balance: 10000 }); // пополняем заказчика под тест
session = users.find((u) => u.id === "new-t2@demo.hl")!.id;
const hErr = createTask({ title: "Почасовая", description: "Описание", budget: 3000, hourly: true });
const tHourly = tasks[0].id;
check("создана почасовая задача", hErr === null, hErr ?? "");
session = users.find((u) => u.id === "new-t@demo.hl")!.id;
assignExecutor(tHourly, ex.id);
submitProof(tHourly, 2 * 3600000);
session = users.find((u) => u.id === "new-t2@demo.hl")!.id;
const p2 = acceptWork(tHourly);
check("почасовая: 2ч×1000=2000, минус 5% = 1900", p2 === 1900, `payout=${p2}`);

// 2.6 отклонение возвращает в работу с комментарием
session = users.find((u) => u.id === "new-t2@demo.hl")!.id;
const rErr = createTask({ title: "Откл", description: "Описание", budget: 1000, hourly: false });
const tRej = tasks[0].id;
check("задача для теста отклонения создана", rErr === null, rErr ?? "");
session = users.find((u) => u.id === "new-t@demo.hl")!.id;
applyToTask(tRej);
assignExecutor(tRej, me().id);
submitProof(tRej, 0);
session = users.find((u) => u.id === "new-t2@demo.hl")!.id;
rejectWork(tRej, "Плохое качество");
const rejTask = tasks.find((t) => t.id === tRej)!;
check("отклонение → in_progress + комментарий", rejTask.status === "in_progress" && rejTask.rejectComment === "Плохое качество");

// 2.7 нехватка средств
session = users.find((u) => u.id === "new-t2@demo.hl")!.id;
const balNow = me().balance;
const poor = createTask({ title: "Дорого", description: "Описание", budget: balNow + 99999, hourly: false });
check("задание дороже баланса отклоняется", poor !== null);
check("баланс не изменился", me().balance === balNow);

console.log(`\nИТОГ: ${pass} ✅ / ${fail} ❌`);
process.exit(fail ? 1 : 0);

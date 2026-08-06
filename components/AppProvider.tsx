"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Proof, Role, Task, User } from "@/lib/types";
import { seedTasks, seedUsers } from "@/lib/demo";
import { uid } from "@/lib/types";

const LS_USERS = "hl_users_v1";
const LS_TASKS = "hl_tasks_v1";
const LS_SESSION = "hl_session_v1";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage переполнен (например, большие фото) — молча игнорируем
  }
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  city: string;
  skills: string[];
  hourlyRate: number;
}

interface Store {
  users: User[];
  tasks: Task[];
  current: User | null;
  ready: boolean;
  register: (inp: RegisterInput) => string | null;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
  addCredits: (amount: number) => void;
  createTask: (inp: Omit<Task, "id" | "status" | "customerId" | "applications" | "proofs" | "createdAt">) => string | null;
  applyToTask: (taskId: string) => void;
  assignExecutor: (taskId: string, executorId: string) => void;
  startWork: (taskId: string) => void;
  submitProof: (taskId: string, proof: Omit<Proof, "id" | "at">, elapsedMs: number) => void;
  acceptWork: (taskId: string) => void;
  rejectWork: (taskId: string, comment: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Одноразовая инициализация из localStorage — SSR-безопасно: до монтирования рендерим сид-данные
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setUsers(load<User[]>(LS_USERS, seedUsers));
    setTasks(load<Task[]>(LS_TASKS, seedTasks));
    setSessionId(load<string | null>(LS_SESSION, null));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    save(LS_USERS, users);
  }, [users, ready]);

  useEffect(() => {
    if (!ready) return;
    save(LS_TASKS, tasks);
  }, [tasks, ready]);

  useEffect(() => {
    if (!ready) return;
    if (sessionId) save(LS_SESSION, sessionId);
    else window.localStorage.removeItem(LS_SESSION);
  }, [sessionId, ready]);

  const current = useMemo(
    () => users.find((u) => u.id === sessionId) ?? null,
    [users, sessionId]
  );

  const patchUser = useCallback((id: string, patch: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const patchTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const register = useCallback(
    (inp: RegisterInput): string | null => {
      const email = inp.email.trim().toLowerCase();
      if (!inp.name.trim() || !email || !inp.password) return "Заполните все поля";
      if (users.some((u) => u.email === email)) return "Пользователь с таким email уже есть";
      const user: User = {
        id: uid(),
        name: inp.name.trim(),
        email,
        password: inp.password,
        role: inp.role,
        city: inp.city,
        skills: inp.skills,
        hourlyRate: inp.hourlyRate || 0,
        rating: 0,
        reviews: 0,
        balance: inp.role === "customer" ? 2000 : 1000,
        createdAt: Date.now(),
      };
      setUsers((prev) => [...prev, user]);
      setSessionId(user.id);
      return null;
    },
    [users]
  );

  const login = useCallback(
    (email: string, password: string): string | null => {
      const u = users.find(
        (x) => x.email === email.trim().toLowerCase() && x.password === password
      );
      if (!u) return "Неверный email или пароль";
      setSessionId(u.id);
      return null;
    },
    [users]
  );

  const logout = useCallback(() => setSessionId(null), []);

  const updateProfile = useCallback(
    (patch: Partial<User>) => {
      if (!current) return;
      patchUser(current.id, patch);
    },
    [current, patchUser]
  );

  const addCredits = useCallback(
    (amount: number) => {
      if (!current) return;
      patchUser(current.id, { balance: current.balance + amount });
    },
    [current, patchUser]
  );

  const createTask = useCallback(
    (inp: Omit<Task, "id" | "status" | "customerId" | "applications" | "proofs" | "createdAt">): string | null => {
      if (!current || current.role !== "customer") return "Нужен аккаунт заказчика";
      if (!inp.title.trim() || !inp.description.trim()) return "Заполните название и описание";
      if (inp.budget <= 0) return "Вознаграждение должно быть больше нуля";
      if (current.balance < inp.budget) return "Недостаточно средств на балансе (эскроу)";
      patchUser(current.id, { balance: current.balance - inp.budget });
      const task: Task = {
        ...inp,
        id: uid(),
        status: "open",
        customerId: current.id,
        applications: [],
        proofs: [],
        createdAt: Date.now(),
      };
      setTasks((prev) => [task, ...prev]);
      return null;
    },
    [current, patchUser]
  );

  const applyToTask = useCallback(
    (taskId: string) => {
      if (!current || current.role !== "executor") return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status !== "open") return;
      if (task.applications.some((a) => a.executorId === current.id)) return;
      const applications = [
        ...task.applications,
        { taskId, executorId: current.id, at: Date.now() },
      ];
      patchTask(taskId, { applications, status: "pending" });
    },
    [current, tasks, patchTask]
  );

  const assignExecutor = useCallback(
    (taskId: string, executorId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status !== "pending" && task.status !== "open") return;
      patchTask(taskId, { executorId, status: "in_progress" });
    },
    [tasks, patchTask]
  );

  const startWork = useCallback(
    (taskId: string) => {
      patchTask(taskId, { timerStartedAt: Date.now() });
    },
    [patchTask]
  );

  const submitProof = useCallback(
    (taskId: string, proof: Omit<Proof, "id" | "at">, elapsedMs: number) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !current) return;
      const proofs = [...task.proofs, { ...proof, id: uid(), at: Date.now() }];
      const timerTotalMs = (task.timerTotalMs ?? 0) + elapsedMs;
      patchTask(taskId, { proofs, timerTotalMs, timerStartedAt: undefined, status: "review" });
    },
    [tasks, current, patchTask]
  );

  const acceptWork = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status !== "review" || !task.executorId) return;
      // Сумма: для почасовых — часы × ставка, но не больше бюджета
      let amount = task.budget;
      if (task.hourly && task.timerTotalMs) {
        const hours = task.timerTotalMs / 3600000;
        const executor = users.find((u) => u.id === task.executorId);
        if (executor) amount = Math.min(task.budget, Math.round(hours * executor.hourlyRate));
      }
      const commission = Math.round(amount * 0.05); // комиссия платформы 5%
      const payout = amount - commission;
      const executor = users.find((u) => u.id === task.executorId);
      if (executor) patchUser(task.executorId, { balance: executor.balance + payout });
      patchTask(taskId, { status: "done" });
    },
    [tasks, users, patchTask, patchUser]
  );

  const rejectWork = useCallback(
    (taskId: string, comment: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status !== "review") return;
      patchTask(taskId, { status: "in_progress", rejectComment: comment });
    },
    [tasks, patchTask]
  );

  const value = useMemo<Store>(
    () => ({
      users,
      tasks,
      current,
      ready,
      register,
      login,
      logout,
      updateProfile,
      addCredits,
      createTask,
      applyToTask,
      assignExecutor,
      startWork,
      submitProof,
      acceptWork,
      rejectWork,
    }),
    [users, tasks, current, ready, register, login, logout, updateProfile, addCredits, createTask, applyToTask, assignExecutor, startWork, submitProof, acceptWork, rejectWork]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used within AppProvider");
  return s;
}

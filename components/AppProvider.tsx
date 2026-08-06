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
import { j } from "@/lib/api";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  city: string;
  skills: string[];
  hourlyRate: number;
}

type CreateTaskInput = Omit<
  Task,
  "id" | "status" | "customerId" | "applications" | "proofs" | "createdAt"
>;

interface Store {
  users: User[];
  tasks: Task[];
  current: User | null;
  ready: boolean;
  register: (inp: RegisterInput) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<string | null>;
  addCredits: (amount: number) => Promise<string | null>;
  createTask: (inp: CreateTaskInput) => Promise<string | null>;
  applyToTask: (taskId: string) => Promise<string | null>;
  assignExecutor: (taskId: string, executorId: string) => Promise<string | null>;
  startWork: (taskId: string) => Promise<string | null>;
  submitProof: (
    taskId: string,
    proof: Omit<Proof, "id" | "at">,
    elapsedMs: number
  ) => Promise<string | null>;
  acceptWork: (taskId: string) => Promise<string | null>;
  rejectWork: (taskId: string, comment: string) => Promise<string | null>;
}

const Ctx = createContext<Store | null>(null);

const errMsg = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [current, setCurrent] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Начальная загрузка: сессия + задания + публичные профили.
  // Если API/БД недоступны — показываем пустой UI, ready всё равно выставляем.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [me, ts] = await Promise.all([
          j<{ user: User | null }>("/api/me"),
          j<{ tasks: Task[] }>("/api/tasks"),
        ]);
        if (!alive) return;
        setCurrent(me.user);
        setTasks(ts.tasks);
      } catch {
        // API недоступен (например, нет DATABASE_URL) — пустой старт
      } finally {
        if (alive) setReady(true);
      }
      try {
        const us = await j<{ users: User[] }>("/api/users");
        if (alive) setUsers(us.users);
      } catch {
        // профили не критичны для первого рендера
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const refreshMe = useCallback(async () => {
    try {
      const d = await j<{ user: User | null }>("/api/me");
      if (d.user) {
        setCurrent(d.user);
        setUsers((prev) =>
          prev.some((u) => u.id === d.user!.id)
            ? prev.map((u) => (u.id === d.user!.id ? d.user! : u))
            : [...prev, d.user!]
        );
      }
    } catch {
      // баланс просто останется прежним до следующего обновления
    }
  }, []);

  const upsertTask = useCallback((t: Task) => {
    setTasks((prev) => {
      const i = prev.findIndex((x) => x.id === t.id);
      if (i === -1) return [t, ...prev];
      const next = [...prev];
      next[i] = t;
      return next;
    });
  }, []);

  const register = useCallback(
    async (inp: RegisterInput): Promise<string | null> => {
      try {
        const d = await j<{ user: User }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(inp),
        });
        setCurrent(d.user);
        setUsers((prev) =>
          prev.some((u) => u.id === d.user.id) ? prev : [...prev, d.user]
        );
        return null;
      } catch (e) {
        return errMsg(e, "Ошибка регистрации");
      }
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        const d = await j<{ user: User }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setCurrent(d.user);
        setUsers((prev) =>
          prev.some((u) => u.id === d.user.id) ? prev : [...prev, d.user]
        );
        return null;
      } catch (e) {
        return errMsg(e, "Ошибка входа");
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await j("/api/auth/logout", { method: "POST" });
    } catch {
      // куки может не быть — выходим локально
    }
    setCurrent(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<User>): Promise<string | null> => {
      try {
        const d = await j<{ user: User }>("/api/me", {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        setCurrent(d.user);
        setUsers((prev) =>
          prev.map((u) => (u.id === d.user.id ? d.user : u))
        );
        return null;
      } catch (e) {
        return errMsg(e, "Ошибка сохранения профиля");
      }
    },
    []
  );

  const addCredits = useCallback(
    async (amount: number): Promise<string | null> => {
      try {
        const d = await j<{ user: User }>("/api/me/credits", {
          method: "POST",
          body: JSON.stringify({ amount }),
        });
        setCurrent(d.user);
        setUsers((prev) =>
          prev.map((u) => (u.id === d.user.id ? d.user : u))
        );
        return null;
      } catch (e) {
        return errMsg(e, "Ошибка начисления кредитов");
      }
    },
    []
  );

  const createTask = useCallback(
    async (inp: CreateTaskInput): Promise<string | null> => {
      try {
        const d = await j<{ task: Task }>("/api/tasks", {
          method: "POST",
          body: JSON.stringify(inp),
        });
        upsertTask(d.task);
        // эскроу списал бюджет — берём актуальный баланс с сервера
        await refreshMe();
        return null;
      } catch (e) {
        return errMsg(e, "Ошибка публикации задания");
      }
    },
    [upsertTask, refreshMe]
  );

  const applyToTask = useCallback(
    async (taskId: string): Promise<string | null> => {
      try {
        const d = await j<{ task: Task }>(`/api/tasks/${taskId}/apply`, {
          method: "POST",
        });
        upsertTask(d.task);
        return null;
      } catch (e) {
        return errMsg(e, "Ошибка отклика");
      }
    },
    [upsertTask]
  );

  const assignExecutor = useCallback(
    async (taskId: string, executorId: string): Promise<string | null> => {
      try {
        const d = await j<{ task: Task }>(`/api/tasks/${taskId}/assign`, {
          method: "POST",
          body: JSON.stringify({ executorId }),
        });
        upsertTask(d.task);
        return null;
      } catch (e) {
        return errMsg(e, "Ошибка назначения исполнителя");
      }
    },
    [upsertTask]
  );

  const startWork = useCallback(
    async (taskId: string): Promise<string | null> => {
      try {
        const d = await j<{ task: Task }>(`/api/tasks/${taskId}/start`, {
          method: "POST",
        });
        upsertTask(d.task);
        return null;
      } catch (e) {
        return errMsg(e, "Ошибка запуска таймера");
      }
    },
    [upsertTask]
  );

  const submitProof = useCallback(
    async (
      taskId: string,
      proof: Omit<Proof, "id" | "at">,
      elapsedMs: number
    ): Promise<string | null> => {
      try {
        const d = await j<{ task: Task }>(`/api/tasks/${taskId}/proof`, {
          method: "POST",
          body: JSON.stringify({ proof, elapsedMs }),
        });
        upsertTask(d.task);
        return null;
      } catch (e) {
        return errMsg(e, "Ошибка отправки отчёта");
      }
    },
    [upsertTask]
  );

  const acceptWork = useCallback(
    async (taskId: string): Promise<string | null> => {
      try {
        const d = await j<{ task: Task }>(`/api/tasks/${taskId}/accept`, {
          method: "POST",
        });
        upsertTask(d.task);
        return null;
      } catch (e) {
        return errMsg(e, "Ошибка приёмки работы");
      }
    },
    [upsertTask]
  );

  const rejectWork = useCallback(
    async (taskId: string, comment: string): Promise<string | null> => {
      try {
        const d = await j<{ task: Task }>(`/api/tasks/${taskId}/reject`, {
          method: "POST",
          body: JSON.stringify({ comment }),
        });
        upsertTask(d.task);
        return null;
      } catch (e) {
        return errMsg(e, "Ошибка отклонения работы");
      }
    },
    [upsertTask]
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
    [
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
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used within AppProvider");
  return s;
}

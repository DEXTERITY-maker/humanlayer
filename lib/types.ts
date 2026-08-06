export type Role = "executor" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  city: string;
  phone?: string;
  telegram?: string;
  skills: string[];
  hourlyRate: number;
  rating: number;
  reviews: number;
  balance: number;
  createdAt: number;
}

export type TaskStatus =
  | "open"
  | "pending"
  | "in_progress"
  | "review"
  | "done"
  | "rejected";

export interface Proof {
  id: string;
  type: "photo" | "video" | "text";
  name: string;
  dataUrl?: string;
  text?: string;
  at: number;
}

export interface Application {
  taskId: string;
  executorId: string;
  at: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  location?: string;
  deadline: string; // YYYY-MM-DD
  budget: number;
  hourly: boolean;
  skills: string[];
  status: TaskStatus;
  customerId: string;
  executorId?: string;
  applications: Application[];
  proofs: Proof[];
  rejectComment?: string;
  createdAt: number;
  timerStartedAt?: number;
  timerTotalMs?: number;
}

export const CATEGORIES = [
  "Доставка",
  "Фотография",
  "Перевод",
  "Печать",
  "Ремонт",
  "Уборка",
  "Уход за животными",
  "Съёмка видео",
  "Тестирование",
  "Другое",
] as const;

export const SKILLS = [
  "Доставка",
  "Фотография",
  "Перевод",
  "Печать",
  "Ремонт",
  "Уборка",
  "Уход за животными",
  "Съёмка видео",
  "Тестирование",
  "Курьер",
  "Веб-разработка",
  "Дизайн",
] as const;

export const CITIES = [
  "Москва",
  "Санкт-Петербург",
  "Казань",
  "Новосибирск",
  "Екатеринбург",
] as const;

export const STATUS_LABEL: Record<TaskStatus, string> = {
  open: "Ищет исполнителя",
  pending: "Ожидает подтверждения",
  in_progress: "В работе",
  review: "На проверке",
  done: "Выполнено",
  rejected: "Отклонено",
};

export const STATUS_COLOR: Record<TaskStatus, string> = {
  open: "bg-mint-500/15 text-mint-300 border-mint-500/30",
  pending: "bg-accent-500/15 text-accent-300 border-accent-500/30",
  in_progress: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  review: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  done: "bg-mint-500/15 text-mint-300 border-mint-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
};

export const fmt = (n: number) => n.toLocaleString("ru-RU") + " кр.";

export const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

export const fmtClock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
};

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

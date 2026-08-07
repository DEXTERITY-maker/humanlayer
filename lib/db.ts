import { Pool } from "@neondatabase/serverless";
import type { Task, User } from "@/lib/types";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('executor','customer')),
  city TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  telegram TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  hourly_rate INT NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  reviews INT NOT NULL DEFAULT 0,
  balance INT NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  deadline TEXT NOT NULL,
  budget INT NOT NULL,
  hourly BOOLEAN NOT NULL DEFAULT false,
  skills TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open',
  customer_id TEXT NOT NULL REFERENCES users(id),
  executor_id TEXT REFERENCES users(id),
  applications JSONB NOT NULL DEFAULT '[]',
  proofs JSONB NOT NULL DEFAULT '[]',
  reject_comment TEXT NOT NULL DEFAULT '',
  created_at BIGINT NOT NULL,
  timer_started_at BIGINT,
  timer_total_ms BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_city ON tasks(city);
CREATE INDEX IF NOT EXISTS idx_tasks_customer ON tasks(customer_id);
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  from_id TEXT NOT NULL REFERENCES users(id),
  to_id TEXT NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_to ON reviews(to_id);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read, created_at);
`;

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool.query(SCHEMA).then(() => undefined).catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

/**
 * Сырая строка из БД. pg возвращает нетипизированные объекты — это намеренно:
 * мапперы (rowToUser/rowToTask) приводят их к доменным типам.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbRow = any;

/** Короткая обёртка: гарантирует схему и выполняет запрос */
export async function q<T = DbRow>(text: string, params?: unknown[]): Promise<T[]> {
  await ensureSchema();
  const res = await pool.query(text, params as DbRow[]);
  return res.rows as T[];
}

/** Транзакция (для эскроу-операций) */
export async function withTx<T>(fn: (client: { query: (t: string, p?: unknown[]) => Promise<{ rows: DbRow[] }> }) => Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn({
      query: async (t: string, p?: unknown[]) => {
        const r = await client.query(t, p as DbRow[]);
        return { rows: r.rows };
      },
    });
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/* ---------- мапперы ---------- */

export function rowToUser(r: DbRow): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    city: r.city,
    phone: r.phone,
    telegram: r.telegram,
    skills: r.skills ?? [],
    hourlyRate: r.hourly_rate,
    rating: Number(r.rating),
    reviews: r.reviews,
    balance: r.balance,
    createdAt: Number(r.created_at),
  };
}

/** Публичный профиль — без email/пароля/баланса */
export function publicUser(r: DbRow) {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    city: r.city,
    phone: r.phone,
    telegram: r.telegram,
    skills: r.skills ?? [],
    hourlyRate: r.hourly_rate,
    rating: Number(r.rating),
    reviews: r.reviews,
  };
}

export function rowToTask(r: DbRow): Task {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    city: r.city,
    location: r.location,
    deadline: r.deadline,
    budget: r.budget,
    hourly: r.hourly,
    skills: r.skills ?? [],
    status: r.status,
    customerId: r.customer_id,
    executorId: r.executor_id ?? undefined,
    applications: r.applications ?? [],
    proofs: r.proofs ?? [],
    rejectComment: r.reject_comment || undefined,
    createdAt: Number(r.created_at),
    timerStartedAt: r.timer_started_at != null ? Number(r.timer_started_at) : undefined,
    timerTotalMs: r.timer_total_ms != null ? Number(r.timer_total_ms) : 0,
  };
}

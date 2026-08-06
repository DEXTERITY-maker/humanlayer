/**
 * Миграция схемы + сид демо-данных.
 * Запуск: npx tsx scripts/seed.ts   (нужен DATABASE_URL в .env.local или окружении)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// tsx не читает .env.local сам — подгружаем вручную
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL не задан. Создайте .env.local или экспортируйте переменную.");
  process.exit(1);
}

import { Pool } from "@neondatabase/serverless";
import { seedTasks, seedUsers } from "../lib/demo";
import { hashPassword } from "../lib/auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

async function main() {
  const schema = `
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
`;
  await pool.query(schema);
  console.log("✅ Схема применена");

  const { rows } = await pool.query("SELECT COUNT(*)::int AS c FROM users");
  if (rows[0].c > 0) {
    console.log(`ℹ️  В БД уже ${rows[0].c} пользователей — сид пропущен`);
    await pool.end();
    return;
  }

  for (const u of seedUsers) {
    await pool.query(
      `INSERT INTO users (id,name,email,password_hash,role,city,phone,telegram,skills,hourly_rate,rating,reviews,balance,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [u.id, u.name, u.email, hashPassword("humanlayer2026"), u.role, u.city, u.phone ?? "", u.telegram ?? "", u.skills, u.hourlyRate, u.rating, u.reviews, u.balance, u.createdAt]
    );
  }
  console.log(`✅ Пользователи: ${seedUsers.length}`);

  for (const t of seedTasks) {
    await pool.query(
      `INSERT INTO tasks (id,title,description,category,city,location,deadline,budget,hourly,skills,status,customer_id,applications,proofs,reject_comment,created_at,timer_total_ms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [t.id, t.title, t.description, t.category, t.city, t.location ?? "", t.deadline, t.budget, t.hourly, t.skills, t.status, t.customerId, JSON.stringify(t.applications), JSON.stringify(t.proofs), t.rejectComment ?? "", t.createdAt, t.timerTotalMs ?? 0]
    );
  }
  console.log(`✅ Задания: ${seedTasks.length}`);

  await pool.end();
  console.log("🎉 Сид завершён. Сайт готов к работе.");
}

main().catch((e) => {
  console.error("❌ Ошибка:", e.message ?? e);
  process.exit(1);
});

import { readFileSync } from "node:fs";

// tsx не грузит .env.local автоматически, а lib/db читает DATABASE_URL
// при импорте — поэтому env грузим ДО динамического импорта db.
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

async function main() {
  const { q } = await import("../lib/db");
  const before = await q(
    "SELECT count(*)::int AS c FROM users WHERE email LIKE '%@test.local'"
  );
  await q(
    "DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.local')"
  );
  await q(
    "DELETE FROM reviews WHERE to_id IN (SELECT id FROM users WHERE email LIKE '%@test.local') OR from_id IN (SELECT id FROM users WHERE email LIKE '%@test.local')"
  );
  await q(
    "DELETE FROM tasks WHERE customer_id IN (SELECT id FROM users WHERE email LIKE '%@test.local') OR executor_id IN (SELECT id FROM users WHERE email LIKE '%@test.local')"
  );
  await q("DELETE FROM users WHERE email LIKE '%@test.local'");
  const after = await q(
    "SELECT count(*)::int AS c FROM users WHERE email LIKE '%@test.local'"
  );
  const open = await q("SELECT title, status FROM tasks WHERE status = 'open'");
  console.log("test users before:", before[0].c, "-> after:", after[0].c);
  console.log("осталось open-задач:", open.length, JSON.stringify(open));
}

main().then(() => process.exit(0));

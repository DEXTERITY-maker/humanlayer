import { uid } from "@/lib/types";
import { q } from "@/lib/db";

export async function notify(userId: string, type: string, message: string, link = "") {
  await q(
    "INSERT INTO notifications (id, user_id, type, message, link, created_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [uid(), userId, type, message, link, Date.now()]
  );
}

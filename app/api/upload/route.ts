import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getSessionUserId } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Файл слишком большой (макс 5 MB)" }, { status: 413 });
  }

  // Check MIME type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, name), buf);

  return NextResponse.json({ url: `/uploads/${name}`, name: file.name });
}

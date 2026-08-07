import { NextResponse } from "next/server";
import { q, publicUser } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const users = await q("SELECT * FROM users WHERE id = $1", [id]);
  if (users.length === 0) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const reviews = await q(
    `SELECT r.id, r.rating, r.comment, r.created_at,
            u.name AS from_name, u.id AS from_id
     FROM reviews r
     JOIN users u ON u.id = r.from_id
     WHERE r.to_id = $1
     ORDER BY r.created_at DESC
     LIMIT 20`,
    [id]
  );

  const statsRows = await q(
    "SELECT COUNT(*)::int AS total_tasks, COALESCE(AVG(rating),0) AS avg_rating, COUNT(*)::int AS total_reviews FROM reviews WHERE to_id = $1",
    [id]
  );
  const stats = statsRows[0] || { total_tasks: 0, avg_rating: 0, total_reviews: 0 };

  return NextResponse.json({
    user: publicUser(users[0]),
    reviews: reviews.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: Number(r.created_at),
      fromName: r.from_name,
      fromId: r.from_id,
    })),
    stats: {
      totalTasks: stats.total_tasks,
      avgRating: Math.round(Number(stats.avg_rating) * 10) / 10,
      totalReviews: stats.total_reviews,
    },
  });
}

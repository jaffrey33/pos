// app/api/menu/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.menuItem.findMany({ orderBy: { name: "asc" } });
  return Response.json(items);
}
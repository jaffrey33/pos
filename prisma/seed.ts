import "dotenv/config"; // seed.ts runs standalone — needs its own env load
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { MENU } from "../lib/menu";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORY_MAP: Record<string, "DRINKS" | "SNACKS" | "MEALS"> = {
  Drinks: "DRINKS",
  Snacks: "SNACKS",
  Meals: "MEALS",
};

async function main() {
  await prisma.menuItem.createMany({
    data: MENU.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      category: CATEGORY_MAP[item.category],
      tag: item.tag,
    })),
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
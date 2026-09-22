import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { orderType, lines } = await req.json();

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    const subtotal = lines.reduce(
      (sum: number, l: { qty: number; unitPrice: number }) => sum + l.qty * l.unitPrice,
      0
    );
    const tax = 0; // no tax in your current UI — bump this if you reintroduce it
    const total = subtotal + tax;

    const order = await prisma.order.create({
      data: {
        orderType: orderType === "Takeaway" ? "TAKEAWAY" : "DINE_IN",
        subtotal,
        tax,
        total,
        items: {
          create: lines.map((l: { menuItemId: string; qty: number; unitPrice: number }) => ({
            menuItemId: l.menuItemId,
            qty: l.qty,
            unitPrice: l.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
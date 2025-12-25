import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifySession } from "@/lib/auth";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      include: {
        _count: {
          select: { guests: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error("Get tables error:", error);
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = await getSession();
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, x, y, width, height, seats, shape, venueId } = body;

    if (!name || !venueId) {
      return NextResponse.json({ error: "Name and venueId are required" }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: {
        name,
        x: x || 100,
        y: y || 100,
        width: width || 80,
        height: height || 80,
        seats: seats || 10,
        shape: shape || "ROUND",
        venueId,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error("Create table error:", error);
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const token = await getSession();
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tables } = body;

    if (!Array.isArray(tables)) {
      return NextResponse.json({ error: "Tables array is required" }, { status: 400 });
    }

    // Batch update table positions
    const updates = tables.map((table: { id: string; x: number; y: number }) =>
      prisma.table.update({
        where: { id: table.id },
        data: { x: table.x, y: table.y },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Batch update tables error:", error);
    return NextResponse.json({ error: "Failed to update tables" }, { status: 500 });
  }
}

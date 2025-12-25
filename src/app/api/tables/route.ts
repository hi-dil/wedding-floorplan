import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifySession } from "@/lib/auth";

// Natural sort function for table names (e.g., "Table 2" before "Table 10")
function naturalSort(a: string, b: string): number {
  const regex = /(\d+)|(\D+)/g;
  const aParts = a.match(regex) || [];
  const bParts = b.match(regex) || [];

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || "";
    const bPart = bParts[i] || "";

    const aNum = parseInt(aPart, 10);
    const bNum = parseInt(bPart, 10);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum;
    } else {
      const cmp = aPart.localeCompare(bPart);
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      include: {
        _count: {
          select: { guests: true },
        },
        guests: {
          select: { pax: true },
        },
      },
    });

    // Calculate total pax for each table
    const tablesWithPax = tables.map((table) => {
      const totalPax = table.guests.reduce((sum, g) => sum + g.pax, 0);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { guests, ...tableWithoutGuests } = table;
      return {
        ...tableWithoutGuests,
        _sum: { pax: totalPax },
      };
    });

    // Sort tables by name using natural sort
    tablesWithPax.sort((a, b) => naturalSort(a.name, b.name));

    return NextResponse.json(tablesWithPax);
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

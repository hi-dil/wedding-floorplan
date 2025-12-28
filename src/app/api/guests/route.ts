import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";

  try {
    const where = search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

    const [guests, total, assigned, checkedIn, paxAggregate] = await Promise.all([
      prisma.guest.findMany({
        where,
        include: {
          table: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.guest.count({ where }),
      prisma.guest.count({ where: { ...where, tableId: { not: null } } }),
      prisma.guest.count({ where: { ...where, checkedInAt: { not: null } } }),
      prisma.guest.aggregate({ where, _sum: { pax: true } }),
    ]);

    const totalPax = paxAggregate._sum.pax || 0;

    return NextResponse.json({
      guests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        assigned,
        checkedIn,
        notCheckedIn: total - checkedIn,
        totalPax,
      },
    });
  } catch (error) {
    console.error("Get guests error:", error);
    return NextResponse.json({ error: "Failed to fetch guests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Verify admin session
  const token = await getSession();
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, phone, email, notes, tableId, seatNumber, pax = 1 } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const guestPax = Math.max(1, parseInt(pax) || 1);

    // Validate seat availability if assigning to a table
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: {
          guests: {
            select: { pax: true },
          },
        },
      });

      if (!table) {
        return NextResponse.json({ error: "Table not found" }, { status: 404 });
      }

      const currentOccupancy = table.guests.reduce((sum, g) => sum + g.pax, 0);
      const availableSeats = table.seats - currentOccupancy;

      if (guestPax > availableSeats) {
        return NextResponse.json(
          {
            error: `Not enough seats. Table "${table.name}" has ${availableSeats} seat(s) available, but guest requires ${guestPax} seat(s).`,
          },
          { status: 400 }
        );
      }
    }

    const guest = await prisma.guest.create({
      data: {
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        pax: guestPax,
        tableId: tableId || null,
        seatNumber: seatNumber || null,
      },
      include: {
        table: true,
      },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    console.error("Create guest error:", error);
    return NextResponse.json({ error: "Failed to create guest" }, { status: 500 });
  }
}

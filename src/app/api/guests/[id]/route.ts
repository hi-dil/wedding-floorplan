import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifySession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Get guest error:", error);
    return NextResponse.json({ error: "Failed to fetch guest" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getSession();
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, phone, email, notes, tableId, seatNumber, pax } = body;

    const guestPax = pax !== undefined ? Math.max(1, parseInt(pax) || 1) : undefined;

    // Validate seat availability if assigning to a table
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: {
          guests: {
            select: { id: true, pax: true },
          },
        },
      });

      if (!table) {
        return NextResponse.json({ error: "Table not found" }, { status: 404 });
      }

      // Get current guest's pax if they're already at this table
      const currentGuest = await prisma.guest.findUnique({
        where: { id },
        select: { pax: true, tableId: true },
      });

      // Calculate occupancy excluding this guest if they're already at the table
      const currentOccupancy = table.guests
        .filter((g) => g.id !== id)
        .reduce((sum, g) => sum + g.pax, 0);

      const newPax = guestPax ?? currentGuest?.pax ?? 1;
      const availableSeats = table.seats - currentOccupancy;

      if (newPax > availableSeats) {
        return NextResponse.json(
          {
            error: `Not enough seats. Table "${table.name}" has ${availableSeats} seat(s) available, but guest requires ${newPax} seat(s).`,
          },
          { status: 400 }
        );
      }
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: {
        name: name?.trim(),
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        ...(guestPax !== undefined && { pax: guestPax }),
        tableId: tableId || null,
        seatNumber: seatNumber || null,
      },
      include: { table: true },
    });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Update guest error:", error);
    return NextResponse.json({ error: "Failed to update guest" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getSession();
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.guest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete guest error:", error);
    return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 });
  }
}

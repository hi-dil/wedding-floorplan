import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifySession } from "@/lib/auth";

interface BatchGuestInput {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  pax?: string | number;
  tableName?: string;
}

interface BatchError {
  row: number;
  name: string;
  error: string;
}

export async function POST(request: NextRequest) {
  // Verify admin session
  const token = await getSession();
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { guests } = body as { guests: BatchGuestInput[] };

    if (!Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json(
        { error: "guests array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Fetch all tables for name matching with current occupancy
    const tables = await prisma.table.findMany({
      select: {
        id: true,
        name: true,
        seats: true,
        guests: {
          select: { pax: true },
        },
      },
    });

    // Create a map for case-insensitive table name lookup with availability tracking
    const tableMap = new Map<
      string,
      { id: string; seats: number; currentPax: number }
    >();
    for (const table of tables) {
      const currentPax = table.guests.reduce((sum, g) => sum + g.pax, 0);
      tableMap.set(table.name.toLowerCase().trim(), {
        id: table.id,
        seats: table.seats,
        currentPax,
      });
    }

    const errors: BatchError[] = [];
    const validGuests: {
      name: string;
      phone: string | null;
      email: string | null;
      notes: string | null;
      pax: number;
      tableId: string | null;
    }[] = [];

    // Validate each guest
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      const rowNum = i + 1; // 1-indexed for user display

      // Validate name
      if (!guest.name || typeof guest.name !== "string" || guest.name.trim().length === 0) {
        errors.push({
          row: rowNum,
          name: guest.name || "(empty)",
          error: "Name is required",
        });
        continue;
      }

      // Parse pax (default to 1)
      const guestPax = Math.max(1, parseInt(String(guest.pax)) || 1);

      // Resolve table name to ID
      let tableId: string | null = null;
      if (guest.tableName && guest.tableName.trim()) {
        const normalizedTableName = guest.tableName.toLowerCase().trim();
        const tableInfo = tableMap.get(normalizedTableName);

        if (!tableInfo) {
          // Log warning but still create guest without table
          errors.push({
            row: rowNum,
            name: guest.name.trim(),
            error: `Table "${guest.tableName}" not found - guest created without table assignment`,
          });
        } else {
          // Check seat availability
          const availableSeats = tableInfo.seats - tableInfo.currentPax;
          if (guestPax > availableSeats) {
            errors.push({
              row: rowNum,
              name: guest.name.trim(),
              error: `Not enough seats at "${guest.tableName}" (${availableSeats} available, ${guestPax} needed) - guest created without table assignment`,
            });
          } else {
            tableId = tableInfo.id;
            // Update tracking for subsequent guests in this batch
            tableInfo.currentPax += guestPax;
          }
        }
      }

      validGuests.push({
        name: guest.name.trim(),
        phone: guest.phone?.trim() || null,
        email: guest.email?.trim() || null,
        notes: guest.notes?.trim() || null,
        pax: guestPax,
        tableId,
      });
    }

    // Batch create valid guests
    let createdCount = 0;
    if (validGuests.length > 0) {
      const result = await prisma.guest.createMany({
        data: validGuests,
      });
      createdCount = result.count;
    }

    // Fetch created guests for response
    const createdGuests = await prisma.guest.findMany({
      where: {
        name: {
          in: validGuests.map((g) => g.name),
        },
      },
      include: {
        table: true,
      },
      orderBy: { createdAt: "desc" },
      take: validGuests.length,
    });

    return NextResponse.json({
      success: createdCount,
      failed: guests.length - validGuests.length,
      warnings: errors.filter((e) => e.error.includes("not found")),
      errors: errors.filter((e) => !e.error.includes("not found")),
      guests: createdGuests,
    });
  } catch (error) {
    console.error("Batch create guests error:", error);
    return NextResponse.json(
      { error: "Failed to create guests" },
      { status: 500 }
    );
  }
}

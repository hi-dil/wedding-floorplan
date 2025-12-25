import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const venue = await prisma.venue.findFirst({
      include: {
        tables: {
          include: {
            _count: {
              select: { guests: true },
            },
            guests: {
              select: { pax: true },
            },
          },
        },
        fixtures: true,
      },
    });

    if (!venue) {
      return NextResponse.json({ error: "No venue found" }, { status: 404 });
    }

    // Calculate total pax for each table and add _sum
    const venueWithPax = {
      ...venue,
      tables: venue.tables.map((table) => {
        const totalPax = table.guests.reduce((sum, g) => sum + g.pax, 0);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { guests, ...tableWithoutGuests } = table;
        return {
          ...tableWithoutGuests,
          _sum: { pax: totalPax },
        };
      }),
    };

    return NextResponse.json(venueWithPax);
  } catch (error) {
    console.error("Get venue error:", error);
    return NextResponse.json({ error: "Failed to fetch venue" }, { status: 500 });
  }
}

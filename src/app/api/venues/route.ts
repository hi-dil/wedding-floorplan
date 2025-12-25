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
          },
        },
        fixtures: true,
      },
    });

    if (!venue) {
      return NextResponse.json({ error: "No venue found" }, { status: 404 });
    }

    return NextResponse.json(venue);
  } catch (error) {
    console.error("Get venue error:", error);
    return NextResponse.json({ error: "Failed to fetch venue" }, { status: 500 });
  }
}

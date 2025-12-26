import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession, verifySession } from "@/lib/auth";

export async function GET() {
  // Require admin authentication
  const token = await getSession();
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const venue = await prisma.venue.findFirst({
      include: {
        tables: {
          include: {
            guests: {
              orderBy: { name: "asc" },
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
    console.error("Export data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch export data" },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifySession } from "@/lib/auth";

export async function GET() {
  try {
    const fixtures = await prisma.fixture.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(fixtures);
  } catch (error) {
    console.error("Get fixtures error:", error);
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const token = await getSession();
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fixtures } = body as {
      fixtures: Array<{
        id: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      }>;
    };

    if (!fixtures || !Array.isArray(fixtures)) {
      return NextResponse.json({ error: "Invalid fixtures data" }, { status: 400 });
    }

    await prisma.$transaction(
      fixtures.map((fixture) =>
        prisma.fixture.update({
          where: { id: fixture.id },
          data: {
            ...(fixture.x !== undefined && { x: fixture.x }),
            ...(fixture.y !== undefined && { y: fixture.y }),
            ...(fixture.width !== undefined && { width: fixture.width }),
            ...(fixture.height !== undefined && { height: fixture.height }),
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Batch update fixtures error:", error);
    return NextResponse.json({ error: "Failed to update fixtures" }, { status: 500 });
  }
}

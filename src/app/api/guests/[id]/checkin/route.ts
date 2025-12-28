import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifySession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getSession();
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const guest = await prisma.guest.update({
      where: { id },
      data: {
        checkedInAt: new Date(),
      },
      include: { table: true },
    });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Failed to check in guest" }, { status: 500 });
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
    const guest = await prisma.guest.update({
      where: { id },
      data: {
        checkedInAt: null,
      },
      include: { table: true },
    });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Undo check-in error:", error);
    return NextResponse.json({ error: "Failed to undo check-in" }, { status: 500 });
  }
}

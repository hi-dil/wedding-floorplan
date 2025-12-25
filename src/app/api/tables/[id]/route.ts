import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifySession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        guests: true,
        _count: {
          select: { guests: true },
        },
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error("Get table error:", error);
    return NextResponse.json({ error: "Failed to fetch table" }, { status: 500 });
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
    const { name, x, y, width, height, seats, shape, rotation } = body;

    const table = await prisma.table.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(seats !== undefined && { seats }),
        ...(shape !== undefined && { shape }),
        ...(rotation !== undefined && { rotation }),
      },
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error("Update table error:", error);
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 });
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
    // First, unassign all guests from this table
    await prisma.guest.updateMany({
      where: { tableId: id },
      data: { tableId: null, seatNumber: null },
    });

    await prisma.table.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete table error:", error);
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
  }
}

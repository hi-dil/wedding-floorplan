import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifySession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const fixture = await prisma.fixture.findUnique({
      where: { id },
    });

    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
    }

    return NextResponse.json(fixture);
  } catch (error) {
    console.error("Get fixture error:", error);
    return NextResponse.json({ error: "Failed to fetch fixture" }, { status: 500 });
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
    const { name, x, y, width, height, rotation, color } = body;

    const fixture = await prisma.fixture.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(rotation !== undefined && { rotation }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json(fixture);
  } catch (error) {
    console.error("Update fixture error:", error);
    return NextResponse.json({ error: "Failed to update fixture" }, { status: 500 });
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
    await prisma.fixture.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete fixture error:", error);
    return NextResponse.json({ error: "Failed to delete fixture" }, { status: 500 });
  }
}

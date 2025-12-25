import { NextRequest, NextResponse } from "next/server";
import {
  validatePassword,
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  verifySession,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = await createSession();
    await setSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const token = await getSession();

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const isValid = await verifySession(token);
    return NextResponse.json({ authenticated: isValid });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ authenticated: false });
  }
}

import { NextResponse } from "next/server";
import { createSessionToken, checkPassword, checkEmail, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const storedEmail = process.env.ADMIN_EMAIL;
    const storedPassword = process.env.ADMIN_PASSWORD;

    if (!storedEmail || !storedPassword) {
      console.error("ADMIN_EMAIL or ADMIN_PASSWORD not set in environment");
      return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
    }

    const emailMatch = checkEmail(email, storedEmail);
    const passwordMatch = checkPassword(password, storedPassword);

    // Check both — never short-circuit (prevents timing attacks)
    if (!emailMatch || !passwordMatch) {
      // Deliberate delay to slow brute-force attempts
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSessionToken(email);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err) {
    console.error("[Auth Login]", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

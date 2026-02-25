import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(request: Request) {
  const body = await request.json();
  const updated = saveSettings(body);
  return NextResponse.json(updated);
}
